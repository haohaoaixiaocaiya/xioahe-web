// ==================== 1. 基础数据与工具函数 ====================
// 快速查找坐标的索引（自动生成）
const cityCoordinates = {};
if (typeof cityGeoJSON !== 'undefined' && cityGeoJSON.features) {
    cityGeoJSON.features.forEach(feature => {
        const name = feature.properties.name;
        const coordinates = feature.geometry.coordinates;
        cityCoordinates[name] = coordinates;
        if (name.endsWith("市") || name.endsWith("省") || name.endsWith("区") || name.endsWith("县")) {
            cityCoordinates[name.slice(0, -1)] = coordinates;
        }
    });
}

// 基础配置
const CONFIG = {
    MEET_DATE: "2020-05-25",        // 相识日期
    FIRST_MEET_DATE: "2023-05-19",   // 第一次见面
    HER_BIRTHDAY: "06-20",           // 她的生日（每年）
    SUPABASE_URL: 'https://kijufqfagmrxzdezlghm.supabase.co',
    SUPABASE_KEY: 'sb_publishable_YikHuIWke6PmjK9oW3UqRA_BrQd3BWM'
};

// 计算两个日期之间的天数（用于恋爱天数）
function getDaysBetween(startDateStr) {
    const startDate = new Date(startDateStr);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffMs = today - startDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// 计算倒计时（用于重要日子）
function getCountdown(targetDateStr) {
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffMs = targetDate - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 计算每年重复日期的倒计时
function getCountdownAnnual(month, day) {
    const today = new Date();
    const currentYear = today.getFullYear();
    let targetDate = new Date(currentYear, month - 1, day);
    
    // 如果今年的日期已过，计算明年的
    if (targetDate < today) {
        targetDate = new Date(currentYear + 1, month - 1, day);
    }
    
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffMs = targetDate - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// ==================== 2. 加载动画 ====================
function showLoading(message = "加载中...") {
    let loadingEl = document.getElementById('loading-overlay');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loading-overlay';
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            flex-direction: column;
        `;
        loadingEl.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid #FF9F1C; 
                        border-top-color: transparent; border-radius: 50%; 
                        animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 15px; color: #666;">${message}</div>
        `;
        document.body.appendChild(loadingEl);
    }
    loadingEl.style.display = 'flex';
}

function hideLoading() {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) loadingEl.style.display = 'none';
}

// 添加旋转动画
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// ==================== 3. Supabase 初始化 ====================
let supabaseClient = null;

function loadSupabaseSDK() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        if (window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
            console.log('✅ Supabase 客户端初始化成功');
            initApp();
        } else {
            console.error('❌ Supabase SDK 加载异常');
            initApp();
        }
    };
    script.onerror = () => {
        console.error('❌ Supabase 脚本加载失败');
        initApp();
    };
    document.head.appendChild(script);
}

// ==================== 4. 本地存储函数 ====================
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('本地存储失败:', e);
    }
}

function loadLocal(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('本地读取失败:', e);
        return defaultValue;
    }
}

// ==================== 5. 云端数据读写 ====================
async function dbSelect(table, orderCol = 'date', ascending = false) {
    if (!supabaseClient) {
        console.warn(`Supabase未初始化，使用本地数据: ${table}`);
        return null;
    }
    try {
        const { data, error } = await supabaseClient.from(table).select('*').order(orderCol, { ascending });
        if (error) { 
            console.error(`读取 ${table} 失败:`, error); 
            return null; 
        }
        return data;
    } catch (err) {
        console.error(`读取 ${table} 异常:`, err);
        return null;
    }
}

async function dbInsert(table, record) {
    if (!supabaseClient) {
        console.warn(`Supabase未初始化，使用本地存储: ${table}`);
        return false;
    }
    try {
        const { error } = await supabaseClient.from(table).insert([record]);
        if (error) { 
            console.error(`写入 ${table} 失败:`, error); 
            return false; 
        }
        return true;
    } catch (err) {
        console.error(`写入 ${table} 异常:`, err);
        return false;
    }
}

async function dbDelete(table, id) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) { 
            console.error(`删除 ${table} 失败:`, error); 
            return false; 
        }
        return true;
    } catch (err) {
        console.error(`删除 ${table} 异常:`, err);
        return false;
    }
}

async function dbUpsert(table, record, conflictKey) {
    if (!supabaseClient) return false;
    try {
        const { error } = await supabaseClient.from(table).upsert([record], { onConflict: conflictKey });
        if (error) { 
            console.error(`更新 ${table} 失败:`, error); 
            return false; 
        }
        return true;
    } catch (err) {
        console.error(`更新 ${table} 异常:`, err);
        return false;
    }
}

// ==================== 6. 页面导航与首页功能 ====================
function setupNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            navButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            const pageId = button.getAttribute("data-page") + "-page";
            pages.forEach(page => page.classList.remove("active"));
            const targetPage = document.getElementById(pageId);
            if (targetPage) targetPage.classList.add("active");

            // 切换到特定页面时刷新内容
            const pageType = button.getAttribute("data-page");
            if (pageType === 'daily') renderDailyRecords();
            if (pageType === 'calendar') renderCalendar();
            if (pageType === 'wish') renderWishes();
            if (pageType === 'memory') {
                setTimeout(initAMap, 100);
                renderMemoryTimeline();
                renderAlbumGrid();
            }
        });
    });

    // 首页快捷入口
    ["daily", "calendar", "wish", "memory"].forEach(type => {
        const entry = document.getElementById(`entry-${type}`);
        if (entry) entry.addEventListener("click", () => {
            const btn = document.querySelector(`.nav-btn[data-page="${type}"]`);
            if (btn) btn.click();
        });
    });
}

function updateHomePage() {
    const loveDaysEl = document.getElementById("love-days");
    if (loveDaysEl) loveDaysEl.textContent = getDaysBetween(CONFIG.MEET_DATE);

    // 倒计时配置
    const countdowns = [
        { id: "countdown-520", date: "2026-05-20" },
        { id: "countdown-dragon", date: "2026-06-29" },
        { id: "countdown-her-birthday", func: () => getCountdownAnnual(6, 20) }, // 她的生日
        { id: "countdown-qixi", date: "2026-08-19" }
    ];
    
    countdowns.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            if (item.func) {
                el.textContent = item.func();
            } else {
                el.textContent = getCountdown(item.date);
            }
        }
    });
}

// ==================== 7. 日常记录功能 ====================
async function renderDailyRecords() {
    showLoading("加载记录中...");
    
    let records = await dbSelect('daily_records', 'date', false);
    if (!Array.isArray(records) || records.length === 0) {
        records = loadLocal("dailyRecords", []);
    }
    if (!Array.isArray(records)) records = [];

    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    const timeline = document.getElementById("timeline");
    if (!timeline) {
        hideLoading();
        return;
    }
    timeline.innerHTML = "";

    // 更新统计
    const today = new Date();
    const monthlyCount = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;

    const monthlyEl = document.getElementById("monthly-count");
    const totalEl = document.getElementById("total-count");
    const dailyLoveEl = document.getElementById("daily-love-days");
    if (monthlyEl) monthlyEl.textContent = monthlyCount;
    if (totalEl) totalEl.textContent = records.length;
    if (dailyLoveEl) dailyLoveEl.textContent = getDaysBetween(CONFIG.MEET_DATE);

    records.forEach(record => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        const imageHtml = record.image ? `<img src="${record.image}" class="timeline-image" alt="记录图片">` : "";
        item.innerHTML = `
            <div class="timeline-date"><span>${formatDate(record.date)}</span><span>${record.mood || ''}</span></div>
            <div class="timeline-author">${record.author || ''}</div>
            <div class="timeline-location">📍 ${record.location || "未知地点"}</div>
            <div class="timeline-content">${record.content || ''}</div>
            ${imageHtml}
        `;
        timeline.appendChild(item);
    });
    
    hideLoading();
}

function setupDailyModal() {
    const addBtn = document.getElementById("add-daily-btn");
    const modal = document.getElementById("add-daily-modal");
    const closeBtn = document.getElementById("close-modal-btn");
    const form = document.getElementById("daily-form");
    const imageInput = document.getElementById("image-input");

    if (!modal || !form) return;

    const openModal = () => modal.classList.add("show");
    const closeModal = () => {
        modal.classList.remove("show");
        form.reset();
    };

    if (addBtn) addBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const author = document.getElementById("author-select")?.value || "";
        const location = document.getElementById("location-input")?.value || "";
        const mood = document.getElementById("mood-select")?.value || "";
        const content = document.getElementById("content-input")?.value || "";

        if (!content.trim()) { 
            alert("请输入记录内容！");
            return; 
        }

        const processAndSave = async (imageData) => {
            showLoading("保存中...");
            const newRecord = {
                id: Date.now(), 
                date: new Date().toISOString(),
                author, 
                location, 
                mood, 
                content, 
                image: imageData
            };
            
            const success = await dbInsert('daily_records', newRecord);
            if (!success) {
                const locals = loadLocal("dailyRecords", []);
                locals.push(newRecord);
                saveLocal("dailyRecords", locals);
            }
            
            renderDailyRecords();
            closeModal();
            hideLoading();
        };

        const file = imageInput?.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => processAndSave(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            processAndSave(null);
        }
    });
}
// ==================== 8. 恋爱日历功能 ====================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

async function renderCalendar() {
    const calendarDays = document.getElementById("calendar-days");
    const currentMonthEl = document.getElementById("current-month");
    const monthMarksEl = document.getElementById("month-marks");
    if (!calendarDays) return;

    calendarDays.innerHTML = "";
    if (monthMarksEl) monthMarksEl.innerHTML = "";
    if (currentMonthEl) currentMonthEl.textContent = `${currentYear}年${currentMonth + 1}月`;

    // 获取标记数据
    let marks = {};
    const cloudMarks = await dbSelect('calendar_marks', 'date', true);
    if (Array.isArray(cloudMarks) && cloudMarks.length > 0) {
        cloudMarks.forEach(m => { marks[m.date] = m.type || m.content || ""; });
    } else {
        marks = loadLocal("calendarMarks", {});
    }
    if (typeof marks !== 'object' || marks === null) marks = {};

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 添加上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = daysInPrevMonth - i;
        calendarDays.appendChild(dayEl);
    }

    // 添加本月的日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        dayEl.textContent = day;
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (dateKey === todayStr) dayEl.classList.add("today");
        if (marks[dateKey]) {
            dayEl.classList.add("marked");
            if (monthMarksEl) {
                const markItem = document.createElement("div");
                markItem.className = "month-mark-item";
                markItem.textContent = `📅 ${currentMonth + 1}月${day}日 - ${marks[dateKey]}`;
                monthMarksEl.appendChild(markItem);
            }
        }
        dayEl.addEventListener("click", () => openCalendarModal(dateKey, `${currentYear}年${currentMonth + 1}月${day}日`));
        calendarDays.appendChild(dayEl);
    }

    // 添加下个月的日期
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = day;
        calendarDays.appendChild(dayEl);
    }
}

function setupCalendarModal() {
    const modal = document.getElementById("calendar-modal");
    const closeBtn = document.getElementById("close-calendar-modal");
    const form = document.getElementById("calendar-form");
    const deleteBtn = document.getElementById("delete-mark-btn");
    if (!modal || !form) return;

    const closeModal = () => {
        modal.classList.remove("show");
        form.reset();
    };
    
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const dateStr = document.getElementById("selected-date")?.value;
        const content = document.getElementById("mark-content")?.value.trim();
        if (!content) { 
            alert("请输入标记内容！"); 
            return; 
        }

        showLoading("保存中...");
        const mark = { date: dateStr, type: content, content: content };
        const success = await dbUpsert('calendar_marks', mark, 'date');
        if (!success) {
            const marks = loadLocal("calendarMarks", {});
            marks[dateStr] = content;
            saveLocal("calendarMarks", marks);
        }
        renderCalendar();
        closeModal();
        hideLoading();
    });

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("确定要删除这个标记吗？")) return;
            const dateStr = document.getElementById("selected-date")?.value;
            showLoading("删除中...");
            
            if (supabaseClient) {
                await supabaseClient.from('calendar_marks').delete().eq('date', dateStr);
            }
            
            const marks = loadLocal("calendarMarks", {});
            delete marks[dateStr];
            saveLocal("calendarMarks", marks);
            
            renderCalendar();
            closeModal();
            hideLoading();
        });
    }

    // 月份切换
    const prevBtn = document.getElementById("prev-month");
    const nextBtn = document.getElementById("next-month");
    if (prevBtn) prevBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });
}

function openCalendarModal(dateStr, dateTitle) {
    const modal = document.getElementById("calendar-modal");
    const titleEl = document.getElementById("modal-date-title");
    const dateInput = document.getElementById("selected-date");
    const contentInput = document.getElementById("mark-content");
    const deleteBtn = document.getElementById("delete-mark-btn");
    if (!modal) return;

    if (titleEl) titleEl.textContent = dateTitle;
    if (dateInput) dateInput.value = dateStr;

    const marks = loadLocal("calendarMarks", {});
    if (marks[dateStr]) {
        if (contentInput) contentInput.value = marks[dateStr];
        if (deleteBtn) deleteBtn.style.display = "block";
    } else {
        if (contentInput) contentInput.value = "";
        if (deleteBtn) deleteBtn.style.display = "none";
    }
    modal.classList.add("show");
}

// ==================== 9. 心愿清单功能 ====================
let currentFilter = "all";

async function renderWishes() {
    showLoading("加载心愿中...");
    
    let wishes = await dbSelect('wishes', 'created_at', false);
    if (!Array.isArray(wishes) || wishes.length === 0) {
        wishes = loadLocal("wishes", []);
    }
    if (!Array.isArray(wishes)) wishes = [];

    wishes.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

    const wishList = document.getElementById("wish-list");
    if (!wishList) {
        hideLoading();
        return;
    }
    wishList.innerHTML = "";

    const total = wishes.length;
    const pending = wishes.filter(w => !w.completed).length;
    const completed = wishes.filter(w => w.completed).length;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt("total-wishes", total);
    setTxt("pending-wishes", pending);
    setTxt("completed-wishes", completed);

    let filtered = wishes;
    if (currentFilter === "pending") filtered = wishes.filter(w => !w.completed);
    else if (currentFilter === "completed") filtered = wishes.filter(w => w.completed);

    filtered.forEach(wish => {
        const card = document.createElement("div");
        card.className = `wish-card ${wish.completed ? "completed" : ""}`;
        card.innerHTML = `
            <div class="wish-actions">
                <button class="wish-action-btn toggle-btn" data-id="${wish.id}" title="${wish.completed ? "标记为待实现" : "标记为已完成"}">${wish.completed ? "✅" : "⭕"}</button>
                <button class="wish-action-btn delete-btn" data-id="${wish.id}" title="删除心愿">🗑️</button>
            </div>
            <span class="wish-tag">${wish.tag || ''}</span>
            <div class="wish-title">${wish.title || ''}</div>
            <div class="wish-desc">${wish.desc || ""}</div>
            <div class="wish-date">发起于：${formatDate(wish.createdAt || wish.created_at)}</div>
        `;
        wishList.appendChild(card);
    });

    wishList.querySelectorAll(".toggle-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const wishId = parseInt(e.currentTarget.getAttribute("data-id"));
            const wish = wishes.find(w => w.id === wishId);
            if (wish) {
                wish.completed = !wish.completed;
                showLoading("更新中...");
                const success = await dbUpsert('wishes', wish, 'id');
                if (!success) {
                    const locals = loadLocal("wishes", []);
                    const localWish = locals.find(w => w.id === wishId);
                    if (localWish) localWish.completed = wish.completed;
                    saveLocal("wishes", locals);
                }
                renderWishes();
                hideLoading();
            }
        });
    });

    wishList.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            if (!confirm("确定要删除这个心愿吗？")) return;
            const wishId = parseInt(e.currentTarget.getAttribute("data-id"));
            showLoading("删除中...");
            
            await dbDelete('wishes', wishId);
            let locals = loadLocal("wishes", []);
            locals = locals.filter(w => w.id !== wishId);
            saveLocal("wishes", locals);
            
            renderWishes();
            hideLoading();
        });
    });
    
    hideLoading();
}

function setupWishModal() {
    const addBtn = document.getElementById("add-wish-btn");
    const modal = document.getElementById("wish-modal");
    const closeBtn = document.getElementById("close-wish-modal");
    const form = document.getElementById("wish-form");
    if (!modal || !form) return;

    const closeModal = () => {
        modal.classList.remove("show");
        form.reset();
    };
    
    if (addBtn) addBtn.addEventListener("click", () => modal.classList.add("show"));
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("wish-title")?.value.trim();
        const desc = document.getElementById("wish-desc")?.value.trim();
        const tag = document.getElementById("wish-tag")?.value;
        if (!title) { 
            alert("请输入心愿标题！"); 
            return; 
        }

        showLoading("添加中...");
        const newWish = { 
            id: Date.now(), 
            title, 
            desc, 
            tag, 
            completed: false, 
            createdAt: new Date().toISOString() 
        };
        
        const success = await dbInsert('wishes', newWish);
        if (!success) {
            const locals = loadLocal("wishes", []);
            locals.push(newWish);
            saveLocal("wishes", locals);
        }
        
        renderWishes();
        closeModal();
        hideLoading();
    });

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderWishes();
        });
    });
}

// ==================== 10. 回忆页（地图+时间线+相册）====================
let map = null;
let mapMarkers = [];
let photoMarkers = []; // 存储照片标记点
let markerCluster = null; // 点聚合器

function initAMap() {
    const container = document.getElementById('amap-container');
    if (!container || typeof AMap === 'undefined') return;

    if (map) { 
        if (markerCluster) {
            markerCluster.setData(null);
            markerCluster = null;
        }
        mapMarkers.forEach(m => {
            if (m && m.remove) m.remove();
        });
        mapMarkers = [];
        photoMarkers = [];
        map.destroy(); 
        map = null; 
    }

    map = new AMap.Map('amap-container', {
        zoom: 4, 
        center: [104.0, 35.0],
        resizeEnable: true, 
        mapStyle: 'amap://styles/light',
        features: ['bg', 'road', 'building', 'point']
    });
    
    // 加载控件
    AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({ position: 'RB' }));
    });

    // 地图加载完成后渲染标记点
    map.on('complete', () => {
        console.log('✅ 地图加载完成');
        renderMapMarkers();      // 渲染普通标记点
        initPhotoMarkers();      // 渲染照片标记点（带聚合）
    });
}

// 渲染普通标记点（用于信息窗口）
async function renderMapMarkers() {
    if (!map) return;
    
    let places = await dbSelect('places', 'date', false);
    if (!Array.isArray(places) || places.length === 0) {
        places = loadLocal("places", []);
    }
    if (!Array.isArray(places)) places = [];

    mapMarkers.forEach(m => {
        if (m && m.remove) m.remove();
    });
    mapMarkers = [];

    places.forEach(place => {
        const coordinates = cityCoordinates[place.name];
        if (!coordinates) return;

        const marker = new AMap.Marker({
            position: coordinates, 
            title: place.name,
            visible: false // 隐藏普通标记点，只用照片标记点
        });
        marker.on('click', () => showPlaceDetail(place));
        marker.setMap(map);
        mapMarkers.push(marker);
    });

    // 更新足迹数量
    const placesCountEl = document.getElementById("places-count");
    if (placesCountEl) placesCountEl.textContent = places.length;
}

// 显示地点详情（信息窗口）
function showPlaceDetail(place) {
    const date = formatDate(place.date);
    const coordinates = cityCoordinates[place.name];
    if (!coordinates) return;
    
    const infoWindow = new AMap.InfoWindow({
        content: `<div style="padding:10px;">
                    <h4 style="margin:0 0 5px 0;">📍 ${place.name}</h4>
                    <p style="margin:0; color:#666;">📅 ${date}</p>
                    ${place.image ? `<img src="${place.image}" style="width:100%; max-height:200px; margin-top:10px; border-radius:5px;">` : ''}
                  </div>`,
        offset: new AMap.Pixel(0, -10)
    });
    infoWindow.open(map, coordinates);
}

// ==================== 11. 照片足迹地图功能（高德地图 JS API 2.0 专用）====================

// 1. 从照片URL读取EXIF坐标
async function getPhotoCoordinates(photoUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = function() {
            EXIF.getData(img, function() {
                const lat = EXIF.getTag(this, "GPSLatitude");
                const lng = EXIF.getTag(this, "GPSLongitude");
                const latRef = EXIF.getTag(this, "GPSLatitudeRef");
                const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
                
                if (lat && lng && latRef && lngRef) {
                    // 转换度分秒为十进制度
                    const latitude = convertDMSToDD(lat, latRef);
                    const longitude = convertDMSToDD(lng, lngRef);
                    resolve({ lat: latitude, lng: longitude });
                } else {
                    resolve(null); // 没有EXIF坐标
                }
            });
        };
        
        img.onerror = function() {
            resolve(null);
        };
        
        img.src = photoUrl;
    });
}

// 度分秒转十进制度
function convertDMSToDD(dms, ref) {
    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];
    
    let dd = degrees + minutes/60 + seconds/3600;
    
    if (ref === "S" || ref === "W") {
        dd = dd * -1;
    }
    
    return dd;
}

// 2. 创建照片数据点（高德2.0要求的数据格式）
function createPhotoPoint(photo) {
    // 获取坐标：优先使用照片自带坐标，其次使用城市坐标
    let coordinates;
    if (photo.lat && photo.lng) {
        coordinates = [photo.lng, photo.lat];
    } else if (photo.name && cityCoordinates[photo.name]) {
        coordinates = cityCoordinates[photo.name];
    } else {
        console.warn(`⚠️ 找不到城市 ${photo.name} 的坐标`);
        return null;
    }
    
    // 返回高德2.0 MarkerCluster要求的数据格式
    return {
        lnglat: coordinates,  // 经纬度数组 [lng, lat]
        photo: photo,          // 原始照片数据
        count: photo.count || 1 // 照片数量（用于聚合显示）
    };
}

// 3. 自定义渲染函数 - 创建单个标记点
function renderMarker(point, context) {
    const photo = point.photo;
    
    // 创建标记容器
    const markerDiv = document.createElement('div');
    markerDiv.className = 'photo-marker';
    markerDiv.innerHTML = `
        <img src="${photo.image || 'https://via.placeholder.com/80x80?text=❤️'}" alt="足迹照片">
        ${point.count > 1 ? `<div class="photo-count">${point.count}</div>` : ''}
    `;
    
    // 添加点击事件
    markerDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        showPhotoPreview(photo);
    });
    
    // 创建 LabelMarker
    return new AMap.LabelMarker({
        position: point.lnglat,
        content: markerDiv,
        offset: new AMap.Pixel(-40, -80), // 调整偏移量
        zooms: [context.zoom, 20] // 只在当前缩放级别显示
    });
}

// 4. 自定义渲染函数 - 创建聚合点
function renderCluster(context) {
    const count = context.count; // 聚合点内的标记数量
    
    // 创建聚合点容器
    const clusterDiv = document.createElement('div');
    clusterDiv.className = 'cluster-marker';
    clusterDiv.style.cssText = `
        width: 50px;
        height: 50px;
        background-color: rgba(255, 159, 28, 0.9);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    clusterDiv.textContent = count;
    
    // 创建聚合标记
    return new AMap.LabelMarker({
        position: context.lnglat,
        content: clusterDiv,
        offset: new AMap.Pixel(-25, -25)
    });
}

// 5. 显示照片预览
function showPhotoPreview(photo) {
    const modal = document.createElement('div');
    modal.className = 'photo-preview-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    const img = document.createElement('img');
    img.src = photo.image;
    img.alt = photo.name || '足迹照片';
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    `;
    
    modal.appendChild(img);
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}

// 6. 初始化所有照片标记点（高德2.0专用）
async function initPhotoMarkers() {
    if (!map) {
        console.error('❌ 地图未初始化');
        return;
    }
    
    // 清除旧的聚合器
    if (markerCluster) {
        markerCluster.setData(null);
        markerCluster = null;
    }
    
    // 从数据库获取足迹数据
    let places = await dbSelect('places', 'date', false);
    if (!Array.isArray(places) || places.length === 0) {
        places = loadLocal("places", []);
    }
    if (!Array.isArray(places)) places = [];
    
    // 更新足迹数量
    const placesCountEl = document.getElementById("places-count");
    if (placesCountEl) placesCountEl.textContent = places.length;
    
    if (places.length === 0) {
        console.log('⚠️ 没有足迹数据');
        return;
    }
    
    // 按城市分组照片
    const groupedByCity = {};
    places.forEach(place => {
        const cityName = place.name;
        if (!groupedByCity[cityName]) {
            groupedByCity[cityName] = [];
        }
        groupedByCity[cityName].push(place);
    });
    
    // 准备数据点（高德2.0要求的格式）
    const points = [];
    for (const cityName in groupedByCity) {
        const photos = groupedByCity[cityName];
        const photo = photos[0]; // 使用第一张照片作为代表
        
        const point = createPhotoPoint({
            id: photo.id,
            image: photo.image || 'https://via.placeholder.com/80x80?text=❤️',
            name: cityName,
            count: photos.length,
            date: photo.date,
            photos: photos,
            lat: photo.lat,
            lng: photo.lng
        });
        
        if (point) {
            points.push(point);
        }
    }
    
    if (points.length === 0) {
        console.log('⚠️ 没有有效的照片数据点');
        return;
    }
    
    // 创建 MarkerCluster（高德2.0专用）
    markerCluster = new AMap.MarkerCluster({
        map: map,
        data: points,                    // 数据数组
        gridSize: 80,                    // 聚合网格大小
        renderMarker: renderMarker,      // 自定义单个标记渲染
        renderClusterMarker: renderCluster // 自定义聚合标记渲染
    });
    
    console.log(`✅ 成功创建 ${points.length} 个照片标记点`);
    
    // 调整地图视野
    if (points.length > 0) {
        const bounds = points.reduce((bounds, point) => {
            return bounds.extend(point.lnglat);
        }, new AMap.Bounds());
        map.setBounds(bounds, {padding: [50, 50, 50, 50]});
    }
}

// 7. 添加新足迹
async function addNewPlace(placeData) {
    // 尝试读取照片EXIF坐标
    if (placeData.image) {
        const exifCoords = await getPhotoCoordinates(placeData.image);
        if (exifCoords) {
            placeData.lat = exifCoords.lat;
            placeData.lng = exifCoords.lng;
            console.log(`✅ 读取到照片的EXIF坐标: ${placeData.lat}, ${placeData.lng}`);
        }
    }
    
    // 保存到数据库
    const success = await dbInsert('places', placeData);
    if (!success) {
        const locals = loadLocal("places", []);
        locals.push(placeData);
        saveLocal("places", locals);
    }
    
    // 重新渲染标记点
    await renderMapMarkers();
    await initPhotoMarkers();
}

// 8. 文件选择器处理
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('place-image-input');
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const files = e.target.files;
            if (files.length === 0) return;
            
            const file = files[0];
            const url = URL.createObjectURL(file);
            
            // 读取EXIF坐标
            const exifCoords = await getPhotoCoordinates(url);
            
            // 获取城市名称
            let cityName = document.getElementById('place-name')?.value || "成都市";
            
            // 如果有EXIF坐标，尝试获取城市名
            if (exifCoords) {
                const city = await getCityByCoordinate(exifCoords.lng, exifCoords.lat);
                if (city) {
                    cityName = city;
                    const nameInput = document.getElementById('place-name');
                    if (nameInput) nameInput.value = city;
                }
            }
            
            // 创建新足迹
            const newPlace = {
                id: Date.now(),
                name: cityName,
                date: new Date().toISOString(),
                image: url,
                ...exifCoords
            };
            
            await addNewPlace(newPlace);
        });
    }
});

// 9. 通过坐标获取城市名
function getCityByCoordinate(lng, lat) {
    return new Promise((resolve) => {
        if (!window.AMap) {
            resolve(null);
            return;
        }
        
        AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new AMap.Geocoder();
            const lnglat = new AMap.LngLat(lng, lat);
            
            geocoder.getAddress(lnglat, function(status, result) {
                if (status === 'complete' && result.regeocode) {
                    const addressComponent = result.regeocode.addressComponent;
                    const city = addressComponent.city || addressComponent.province;
                    resolve(city);
                } else {
                    resolve(null);
                }
            });
        });
    });
}

async function renderMemoryTimeline() {
    let albums = await dbSelect('albums', 'date', false);
    if (!Array.isArray(albums) || albums.length === 0) {
        albums = loadLocal("albums", []);
    }
    if (!Array.isArray(albums)) albums = [];

    albums.sort((a, b) => new Date(b.date) - new Date(a.date));

    const timeline = document.getElementById("memory-timeline");
    if (!timeline) return;
    timeline.innerHTML = "";

    const grouped = {};
    albums.forEach(album => {
        const year = new Date(album.date).getFullYear();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(album);
    });

    Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
        const header = document.createElement("div");
        header.className = "timeline-year";
        header.textContent = `${year}年`;
        header.style.cssText = "margin-bottom:15px;font-weight:bold;color:#FF9F1C;";
        timeline.appendChild(header);

        grouped[year].forEach(album => {
            const item = document.createElement("div");
            item.className = "memory-item";
            item.innerHTML = `
                <div class="memory-album-card">
                    <img src="${album.cover || 'https://picsum.photos/400/300'}" class="memory-album-cover" alt="${album.name}">
                    <div class="memory-album-info">
                        <div class="memory-album-title">${album.name}</div>
                        <div class="memory-album-date">${formatDate(album.date)}</div>
                    </div>
                </div>`;
            timeline.appendChild(item);
        });
    });
}

async function renderAlbumGrid() {
    let albums = await dbSelect('albums', 'date', false);
    if (!Array.isArray(albums) || albums.length === 0) {
        albums = loadLocal("albums", []);
    }
    if (!Array.isArray(albums)) albums = [];

    albums.sort((a, b) => new Date(b.date) - new Date(a.date));

    const grid = document.getElementById("album-grid");
    if (!grid) return;
    grid.innerHTML = `<div class="album-card create-album" id="create-album-btn">
                        <div class="create-icon">+</div>
                        <div>创建新相册</div>
                      </div>`;

    albums.forEach(album => {
        const card = document.createElement("div");
        card.className = "album-card";
        card.innerHTML = `
            <img src="${album.cover || 'https://picsum.photos/300/200'}" class="album-cover" alt="${album.name}">
            <div class="album-info">
                <div class="album-name">${album.name}</div>
                <div class="album-date">${formatDate(album.date)}</div>
            </div>`;
        grid.insertBefore(card, grid.firstChild);
    });

    document.getElementById("create-album-btn")?.addEventListener("click", () => {
        document.getElementById("album-modal")?.classList.add("show");
    });
}

function setupPlaceModal() {
    const addBtn = document.getElementById("add-place-btn");
    const modal = document.getElementById("place-modal");
    const closeBtn = document.getElementById("close-place-modal");
    const form = document.getElementById("place-form");
    if (!modal || !form) return;

    const closeModal = () => {
        modal.classList.remove("show");
        form.reset();
        // 重置文件输入
        const fileInput = document.getElementById("place-image");
        if (fileInput) fileInput.value = '';
    };
    
    if (addBtn) addBtn.addEventListener("click", () => modal.classList.add("show"));
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let name = document.getElementById("place-name")?.value.trim();
        const date = document.getElementById("place-date")?.value || new Date().toISOString();
        if (!name) { 
            alert("请输入城市名称！"); 
            return; 
        }

        // 修复：安全查找城市坐标
        let coordinates = cityCoordinates[name];
        if (!coordinates && typeof cityGeoJSON !== 'undefined') {
            const match = cityGeoJSON.features.find(f => {
                const cityName = f.properties?.name;
                return cityName && (cityName.includes(name) || name.includes(cityName));
            });
            if (match) {
                coordinates = match.geometry.coordinates;
                name = match.properties.name;
                const nameInput = document.getElementById("place-name");
                if (nameInput) nameInput.value = name;
            }
        }
        if (!coordinates) {
            alert(`抱歉，暂时不支持"${name}"的坐标。\n请尝试输入更完整的名称，如"成都市"`);
            return;
        }

        const processAndSave = async (imageData) => {
            showLoading("添加中...");
            const newPlace = { 
                id: Date.now(), 
                name, 
                date, 
                image: imageData,
                lat: coordinates[1], // 保存坐标
                lng: coordinates[0]
            };
            
            const success = await dbInsert('places', newPlace);
            if (!success) {
                const locals = loadLocal("places", []);
                locals.push(newPlace);
                saveLocal("places", locals);
            }
            
            // 重新渲染所有内容
            await renderMapMarkers();
            await initPhotoMarkers();
            renderMemoryTimeline();
            renderAlbumGrid();
            
            closeModal();
            hideLoading();
            alert('✅ 足迹添加成功！');
        };

        const file = document.getElementById("place-image")?.files[0];
        if (file) {
            // 读取EXIF坐标
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const imageUrl = ev.target.result;
                const exifCoords = await getPhotoCoordinates(imageUrl);
                
                if (exifCoords) {
                    // 如果有EXIF坐标，使用它
                    coordinates = [exifCoords.lng, exifCoords.lat];
                }
                
                processAndSave(imageUrl);
            };
            reader.readAsDataURL(file);
        } else {
            processAndSave(null);
        }
    });
}

function setupAlbumModal() {
    const modal = document.getElementById("album-modal");
    const closeBtn = document.getElementById("close-album-modal");
    const form = document.getElementById("album-form");
    if (!modal || !form) return;

    const closeModal = () => {
        modal.classList.remove("show");
        form.reset();
    };
    
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("album-name")?.value.trim();
        const date = document.getElementById("album-date")?.value;
        if (!name) { 
            alert("请输入相册名称！"); 
            return; 
        }

        const processAndSave = async (imageData) => {
            showLoading("创建中...");
            const newAlbum = { id: Date.now(), name, date, cover: imageData, photos: [] };
            const success = await dbInsert('albums', newAlbum);
            if (!success) {
                const locals = loadLocal("albums", []);
                locals.push(newAlbum);
                saveLocal("albums", locals);
            }
            
            renderMemoryTimeline();
            renderAlbumGrid();
            closeModal();
            hideLoading();
        };

        const file = document.getElementById("album-cover")?.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => processAndSave(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            processAndSave(null);
        }
    });
}

function setupMemoryTabs() {
    document.querySelectorAll(".memory-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".memory-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const contentId = tab.getAttribute("data-tab") + "-content";
            document.querySelectorAll(".memory-content").forEach(c => c.classList.remove("active"));
            const target = document.getElementById(contentId);
            if (target) target.classList.add("active");
            if (contentId === "map-content") setTimeout(initAMap, 100);
        });
    });
}

// ==================== 12. 音乐与爱心动画 ====================
function setupMusic() {
    const musicBtn = document.getElementById('music-btn');
    const bgMusic = document.getElementById('bg-music');
    if (!musicBtn || !bgMusic) return;

    let isPlaying = false;
    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            musicBtn.classList.remove('playing');
            musicBtn.textContent = '🎵';
        } else {
            bgMusic.play().catch(() => {
                alert('请先点击页面任意位置激活音频，再点击音乐按钮');
            });
            musicBtn.classList.add('playing');
            musicBtn.textContent = '⏸️';
        }
        isPlaying = !isPlaying;
    });
}

function startFallingHearts() {
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'falling-heart';
        heart.innerHTML = '❤️';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.fontSize = (Math.random() * 15 + 10) + 'px';
        heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 10000);
    }, 2000);
}

// ==================== 13. 应用初始化 ====================
function initApp() {
    setupNavigation();
    setupDailyModal();
    setupCalendarModal();
    setupWishModal();
    setupPlaceModal();
    setupAlbumModal();
    setupMemoryTabs();
    setupMusic();
    startFallingHearts();
    
    // 修复：添加这一行，确保天数显示正常
    updateHomePage();
    
    renderDailyRecords();
    renderCalendar();
    renderWishes();
    renderMemoryTimeline();
    renderAlbumGrid();
    
    console.log('✅ 应用初始化完成');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSupabaseSDK);
} else {
    loadSupabaseSDK();
}

