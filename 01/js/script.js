// 计算两个日期之间的天数
function getDaysBetween(startDateStr) {
    const startDate = new Date(startDateStr);
    const today = new Date();
    // 去掉时间部分，只算日期
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    // 计算相差的毫秒数，转成天数
    const diffMs = today - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 页面加载完成后执行
window.onload = function() {
    // 开始日期
    const startDate = "2018-10-19";
    // 计算天数
    const days = getDaysBetween(startDate);
    // 把天数显示到页面上
    document.getElementById("love-days").textContent = days;
        // 计算重要日子倒计时
    function updateCountdown(elementId, targetDateStr) {
        const targetDate = new Date(targetDateStr);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const diffMs = targetDate - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        // 如果已经过了，显示负数
        document.getElementById(elementId).textContent = diffDays;
    }

    // 更新所有倒计时
    updateCountdown("countdown-520", "2026-05-20");
    updateCountdown("countdown-dragon", "2026-06-29");
    updateCountdown("countdown-his-birthday", "2026-07-06");
    updateCountdown("countdown-qixi", "2026-08-19");
        // 导航栏切换页面
    const navButtons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            // 移除所有按钮的active类
            navButtons.forEach(btn => btn.classList.remove("active"));
            // 给当前点击的按钮加active类
            button.classList.add("active");

            // 获取要显示的页面id
            const pageId = button.getAttribute("data-page") + "-page";
            
            // 隐藏所有页面
            pages.forEach(page => page.classList.remove("active"));
            // 显示对应的页面
            document.getElementById(pageId).classList.add("active");
        });
    });
}
// ==================== 日常记录功能 ====================
// 数据读写工具函数
function saveDailyRecords(records) {
    localStorage.setItem("dailyRecords", JSON.stringify(records));
}

function loadDailyRecords() {
    const records = localStorage.getItem("dailyRecords");
    return records ? JSON.parse(records) : [];
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// 渲染所有记录
function renderDailyRecords() {
    const records = loadDailyRecords();
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    // 按日期倒序排列（最新的在最上面）
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 更新统计数字
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const monthlyCount = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    document.getElementById("monthly-count").textContent = monthlyCount;
    document.getElementById("total-count").textContent = records.length;
    document.getElementById("daily-love-days").textContent = getDaysBetween("2018-10-19");

    // 渲染每条记录
    records.forEach(record => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        
        let imageHtml = "";
        if (record.image) {
            imageHtml = `<img src="${record.image}" class="timeline-image" alt="记录图片">`;
        }

        item.innerHTML = `
            <div class="timeline-date">
                <span>${formatDate(record.date)}</span>
                <span>${record.mood}</span>
            </div>
            <div class="timeline-author">${record.author}</div>
            <div class="timeline-location">📍 ${record.location || "未知地点"}</div>
            <div class="timeline-content">${record.content}</div>
            ${imageHtml}
        `;

        timeline.appendChild(item);
    });
}

// 弹窗控制
const addBtn = document.getElementById("add-daily-btn");
const modal = document.getElementById("add-daily-modal");
const closeBtn = document.getElementById("close-modal-btn");
const dailyForm = document.getElementById("daily-form");
const imageInput = document.getElementById("image-input");

addBtn.addEventListener("click", () => {
    modal.classList.add("show");
});

closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
});

// 点击弹窗外部关闭
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
});

// 提交表单
dailyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const author = document.getElementById("author-select").value;
    const location = document.getElementById("location-input").value;
    const mood = document.getElementById("mood-select").value;
    const content = document.getElementById("content-input").value;

    if (!content.trim()) {
        alert("请输入记录内容！");
        return;
    }

    // 处理图片
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            saveRecord(author, location, mood, content, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        saveRecord(author, location, mood, content, null);
    }
});

// 保存记录
function saveRecord(author, location, mood, content, image) {
    const records = loadDailyRecords();
    const newRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        author,
        location,
        mood,
        content,
        image
    };

    records.push(newRecord);
    saveDailyRecords(records);
    renderDailyRecords();

    // 重置表单并关闭弹窗
    dailyForm.reset();
    modal.classList.remove("show");
}

// 页面加载时渲染记录
window.addEventListener("load", () => {
    renderDailyRecords();
});

// 切换到日常页时重新渲染
document.querySelectorAll('.nav-btn[data-page="daily"]').forEach(btn => {
    btn.addEventListener("click", renderDailyRecords);
});
// ==================== 恋爱日历功能 ====================
// 日历标记数据读写
function saveCalendarMarks(marks) {
    localStorage.setItem("calendarMarks", JSON.stringify(marks));
}

function loadCalendarMarks() {
    const marks = localStorage.getItem("calendarMarks");
    return marks ? JSON.parse(marks) : {};
}

// 当前显示的年月
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// 渲染日历
function renderCalendar() {
    const calendarDays = document.getElementById("calendar-days");
    const currentMonthEl = document.getElementById("current-month");
    const monthMarksEl = document.getElementById("month-marks");
    
    calendarDays.innerHTML = "";
    monthMarksEl.innerHTML = "";

    // 更新月份标题
    currentMonthEl.textContent = `${currentYear}年${currentMonth + 1}月`;

    // 获取当月第一天是星期几（0=周日）
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // 获取当月有多少天
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // 获取上个月有多少天
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const marks = loadCalendarMarks();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    // 填充上个月的最后几天
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = day;
        calendarDays.appendChild(dayEl);
    }

    // 填充当月的天数
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        dayEl.textContent = day;

        const dateStr = `${currentYear}-${currentMonth}-${day}`;

        // 标记今天
        if (dateStr === todayStr) {
            dayEl.classList.add("today");
        }

        // 标记有自定义标记的日期
        if (marks[dateStr]) {
            dayEl.classList.add("marked");
            // 添加到本月标记列表
            const markItem = document.createElement("div");
            markItem.className = "month-mark-item";
            markItem.textContent = `📅 ${currentMonth + 1}月${day}日 - ${marks[dateStr]}`;
            monthMarksEl.appendChild(markItem);
        }

        // 点击日期打开弹窗
        dayEl.addEventListener("click", () => {
            openCalendarModal(dateStr, `${currentYear}年${currentMonth + 1}月${day}日`);
        });

        calendarDays.appendChild(dayEl);
    }

    // 填充下个月的前几天
    const totalDays = firstDay + daysInMonth;
    const remainingDays = 42 - totalDays; // 6行×7列=42格
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = day;
        calendarDays.appendChild(dayEl);
    }
}

// 打开日历标记弹窗
function openCalendarModal(dateStr, dateTitle) {
    const modal = document.getElementById("calendar-modal");
    const modalTitle = document.getElementById("modal-date-title");
    const selectedDateInput = document.getElementById("selected-date");
    const markContentInput = document.getElementById("mark-content");
    const deleteBtn = document.getElementById("delete-mark-btn");

    modalTitle.textContent = dateTitle;
    selectedDateInput.value = dateStr;

    const marks = loadCalendarMarks();
    if (marks[dateStr]) {
        markContentInput.value = marks[dateStr];
        deleteBtn.style.display = "block";
    } else {
        markContentInput.value = "";
        deleteBtn.style.display = "none";
    }

    modal.classList.add("show");
}

// 关闭日历弹窗
function closeCalendarModal() {
    document.getElementById("calendar-modal").classList.remove("show");
}

// 日历弹窗事件
document.getElementById("close-calendar-modal").addEventListener("click", closeCalendarModal);
document.getElementById("calendar-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("calendar-modal")) {
        closeCalendarModal();
    }
});

// 提交日历标记
document.getElementById("calendar-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const dateStr = document.getElementById("selected-date").value;
    const content = document.getElementById("mark-content").value.trim();

    if (!content) {
        alert("请输入标记内容！");
        return;
    }

    const marks = loadCalendarMarks();
    marks[dateStr] = content;
    saveCalendarMarks(marks);
    renderCalendar();
    closeCalendarModal();
});

// 删除日历标记
document.getElementById("delete-mark-btn").addEventListener("click", () => {
    if (confirm("确定要删除这个标记吗？")) {
        const dateStr = document.getElementById("selected-date").value;
        const marks = loadCalendarMarks();
        delete marks[dateStr];
        saveCalendarMarks(marks);
        renderCalendar();
        closeCalendarModal();
    }
});

// 月份切换按钮
document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

// 页面加载时渲染日历
window.addEventListener("load", renderCalendar);

// 切换到日历页时重新渲染
document.querySelectorAll('.nav-btn[data-page="calendar"]').forEach(btn => {
    btn.addEventListener("click", renderCalendar);
});
// ==================== 心愿清单功能 ====================
// 心愿数据读写
function saveWishes(wishes) {
    localStorage.setItem("wishes", JSON.stringify(wishes));
}

function loadWishes() {
    const wishes = localStorage.getItem("wishes");
    return wishes ? JSON.parse(wishes) : [];
}

// 当前筛选状态
let currentFilter = "all";

// 渲染心愿列表
function renderWishes() {
    const wishes = loadWishes();
    const wishList = document.getElementById("wish-list");
    wishList.innerHTML = "";

    // 更新统计数字
    const total = wishes.length;
    const pending = wishes.filter(w => !w.completed).length;
    const completed = wishes.filter(w => w.completed).length;

    document.getElementById("total-wishes").textContent = total;
    document.getElementById("pending-wishes").textContent = pending;
    document.getElementById("completed-wishes").textContent = completed;

    // 根据筛选条件过滤心愿
    let filteredWishes = wishes;
    if (currentFilter === "pending") {
        filteredWishes = wishes.filter(w => !w.completed);
    } else if (currentFilter === "completed") {
        filteredWishes = wishes.filter(w => w.completed);
    }

    // 按创建时间倒序排列
    filteredWishes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 渲染每个心愿
    filteredWishes.forEach(wish => {
        const card = document.createElement("div");
        card.className = `wish-card ${wish.completed ? "completed" : ""}`;
        
        card.innerHTML = `
            <div class="wish-actions">
                <button class="wish-action-btn toggle-btn" data-id="${wish.id}" title="${wish.completed ? "标记为待实现" : "标记为已完成"}">
                    ${wish.completed ? "✅" : "⭕"}
                </button>
                <button class="wish-action-btn delete-btn" data-id="${wish.id}" title="删除心愿">🗑️</button>
            </div>
            <span class="wish-tag">${wish.tag}</span>
            <div class="wish-title">${wish.title}</div>
            <div class="wish-desc">${wish.desc || ""}</div>
            <div class="wish-date">发起于：${formatDate(wish.createdAt)}</div>
        `;

        wishList.appendChild(card);
    });

    // 绑定切换完成状态事件
    document.querySelectorAll(".toggle-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const wishId = parseInt(e.target.getAttribute("data-id"));
            toggleWishComplete(wishId);
        });
    });

    // 绑定删除事件
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (confirm("确定要删除这个心愿吗？")) {
                const wishId = parseInt(e.target.getAttribute("data-id"));
                deleteWish(wishId);
            }
        });
    });
}

// 切换心愿完成状态
function toggleWishComplete(wishId) {
    const wishes = loadWishes();
    const wish = wishes.find(w => w.id === wishId);
    if (wish) {
        wish.completed = !wish.completed;
        saveWishes(wishes);
        renderWishes();
    }
}

// 删除心愿
function deleteWish(wishId) {
    let wishes = loadWishes();
    wishes = wishes.filter(w => w.id !== wishId);
    saveWishes(wishes);
    renderWishes();
}

// 弹窗控制
const addWishBtn = document.getElementById("add-wish-btn");
const wishModal = document.getElementById("wish-modal");
const closeWishModalBtn = document.getElementById("close-wish-modal");
const wishForm = document.getElementById("wish-form");

addWishBtn.addEventListener("click", () => {
    wishModal.classList.add("show");
});

closeWishModalBtn.addEventListener("click", () => {
    wishModal.classList.remove("show");
});

wishModal.addEventListener("click", (e) => {
    if (e.target === wishModal) {
        wishModal.classList.remove("show");
    }
});

// 提交心愿表单
wishForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("wish-title").value.trim();
    const desc = document.getElementById("wish-desc").value.trim();
    const tag = document.getElementById("wish-tag").value;

    if (!title) {
        alert("请输入心愿标题！");
        return;
    }

    const wishes = loadWishes();
    const newWish = {
        id: Date.now(),
        title,
        desc,
        tag,
        completed: false,
        createdAt: new Date().toISOString()
    };

    wishes.push(newWish);
    saveWishes(wishes);
    renderWishes();

    // 重置表单并关闭弹窗
    wishForm.reset();
    wishModal.classList.remove("show");
});

// 筛选按钮事件
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // 移除所有按钮的active类
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        // 给当前点击的按钮加active类
        btn.classList.add("active");
        // 更新筛选状态并重新渲染
        currentFilter = btn.getAttribute("data-filter");
        renderWishes();
    });
});

// 页面加载时渲染心愿
window.addEventListener("load", renderWishes);

// 切换到心愿页时重新渲染
document.querySelectorAll('.nav-btn[data-page="wish"]').forEach(btn => {
    btn.addEventListener("click", renderWishes);
});
// ==================== 回忆页功能 ====================
// 城市坐标映射（高德地图会自动处理，这里只用于添加足迹）
const cityCoordinates = {
    "北京": [116.4074, 39.9042],
    "上海": [121.4737, 31.2304],
    "广州": [113.2644, 23.1291],
    "深圳": [114.0579, 22.5431],
    "杭州": [120.1551, 30.2741],
    "厦门": [118.0894, 24.4798],
    "南昌": [115.8922, 28.6820],
    "保定": [115.4845, 38.8676],
    "香港": [114.1694, 22.3193],
    "成都": [104.0668, 30.5728],
    "西安": [108.9398, 34.3416],
    "重庆": [106.5049, 29.5332],
    "武汉": [114.3054, 30.5928],
    "南京": [118.7969, 32.0617],
    "苏州": [120.5853, 31.2989],
    "青岛": [120.3826, 36.0671],
    "大连": [121.6147, 38.9140],
    "三亚": [109.5050, 18.2528],
    "昆明": [102.7123, 25.0389],
    "丽江": [100.2289, 26.8721]
};

// 足迹数据读写
function savePlaces(places) {
    localStorage.setItem("places", JSON.stringify(places));
}

function loadPlaces() {
    const places = localStorage.getItem("places");
    return places ? JSON.parse(places) : [];
}

// 相册数据读写
function saveAlbums(albums) {
    localStorage.setItem("albums", JSON.stringify(albums));
}

function loadAlbums() {
    const albums = localStorage.getItem("albums");
    return albums ? JSON.parse(albums) : [];
}

// 高德地图实例
let map = null;
// 足迹标记数组
let markers = [];

// 初始化高德地图
function initAMap() {
    // 销毁已有的地图实例
    if (map) {
        map.destroy();
        markers = [];
    }

    // 创建地图实例
    map = new AMap.Map('amap-container', {
        zoom: 4, // 初始缩放级别
        center: [104.0, 35.0], // 初始中心点（中国中心）
        resizeEnable: true, // 允许窗口大小变化时自动调整
        mapStyle: 'amap://styles/light', // 浅色地图风格，和网站更搭
        features: ['bg', 'road', 'building', 'point'] // 显示的图层
    });

    // 添加地图控件
    map.addControl(new AMap.Scale()); // 比例尺
    map.addControl(new AMap.ToolBar({ // 缩放工具条
        position: 'RB' // 右下角
    }));

    // 渲染足迹标记
    renderMapMarkers();
}

// 渲染足迹标记
function renderMapMarkers() {
    if (!map) return;

    // 清除已有的标记
    markers.forEach(marker => map.remove(marker));
    markers = [];

    const places = loadPlaces();
    const placesCount = document.getElementById("places-count");
    placesCount.textContent = places.length;

    // 添加新的标记
    places.forEach(place => {
        if (cityCoordinates[place.name]) {
            const marker = new AMap.Marker({
                position: cityCoordinates[place.name],
                title: `${place.name} - ${formatDate(place.date)}`,
                icon: new AMap.Icon({
                    size: new AMap.Size(20, 20),
                    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGM0IzMCI+PHBhdGggZD0iTTEyIDJjLTQuNDE4IDAtOCAzLjU4Mi04IDhzOCAxMiA4IDEyIDgtMy41ODIgOC0xMi0zLjU4Mi04LTgtOHptMCAxMWMtMS42NTcgMC0zLTEuMzQzLTMtM3MxLjM0My0zIDMtMyAzIDEuMzQzIDMgMy0xLjM0MyAzLTMgM3oiLz48L3N2Zz4=',
                    imageSize: new AMap.Size(20, 20)
                })
            });

            map.add(marker);
            markers.push(marker);
        }
    });
}

// 子标签切换
document.querySelectorAll(".memory-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        // 移除所有标签的active类
        document.querySelectorAll(".memory-tab").forEach(t => t.classList.remove("active"));
        // 给当前点击的标签加active类
        tab.classList.add("active");

        // 获取要显示的内容id
        const contentId = tab.getAttribute("data-tab") + "-content";
        
        // 隐藏所有内容
        document.querySelectorAll(".memory-content").forEach(c => c.classList.remove("active"));
        // 显示对应的内容
        document.getElementById(contentId).classList.add("active");

        // 切换到地图页时重新初始化地图
        if (contentId === "map-content") {
            setTimeout(initAMap, 100);
        }
    });
});

// 渲染记忆长河
function renderMemoryTimeline() {
    const albums = loadAlbums();
    const timeline = document.getElementById("memory-timeline");
    timeline.innerHTML = "";

    // 按日期倒序排列
    albums.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 按年份分组
    const groupedByYear = {};
    albums.forEach(album => {
        const year = new Date(album.date).getFullYear();
        if (!groupedByYear[year]) {
            groupedByYear[year] = [];
        }
        groupedByYear[year].push(album);
    });

    // 渲染每个年份
    Object.keys(groupedByYear).sort((a, b) => b - a).forEach(year => {
        const yearHeader = document.createElement("div");
        yearHeader.className = "timeline-year";
        yearHeader.textContent = `${year}年`;
        yearHeader.style.marginBottom = "15px";
        yearHeader.style.fontWeight = "bold";
        yearHeader.style.color = "#FF9F1C";
        timeline.appendChild(yearHeader);

        groupedByYear[year].forEach(album => {
            const item = document.createElement("div");
            item.className = "memory-item";
            
            item.innerHTML = `
                <div class="memory-album-card">
                    <img src="${album.cover || 'https://picsum.photos/400/300'}" class="memory-album-cover" alt="${album.name}">
                    <div class="memory-album-info">
                        <div class="memory-album-title">${album.name}</div>
                        <div class="memory-album-date">${formatDate(album.date)}</div>
                    </div>
                </div>
            `;

            timeline.appendChild(item);
        });
    });
}

// 渲染时光相册
function renderAlbumGrid() {
    const albums = loadAlbums();
    const albumGrid = document.getElementById("album-grid");
    
    // 保留创建新相册按钮
    albumGrid.innerHTML = `
        <div class="album-card create-album" id="create-album-btn">
            <div class="create-icon">+</div>
            <div>创建新相册</div>
        </div>
    `;

    // 按日期倒序排列
    albums.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 渲染每个相册
    albums.forEach(album => {
        const card = document.createElement("div");
        card.className = "album-card";
        
        card.innerHTML = `
            <img src="${album.cover || 'https://picsum.photos/300/200'}" class="album-cover" alt="${album.name}">
            <div class="album-info">
                <div class="album-name">${album.name}</div>
                <div class="album-date">${formatDate(album.date)}</div>
            </div>
        `;

        albumGrid.insertBefore(card, albumGrid.firstChild);
    });

    // 绑定创建新相册按钮事件
    document.getElementById("create-album-btn").addEventListener("click", () => {
        document.getElementById("album-modal").classList.add("show");
    });
}

// 添加足迹弹窗控制
const addPlaceBtn = document.getElementById("add-place-btn");
const placeModal = document.getElementById("place-modal");
const closePlaceModalBtn = document.getElementById("close-place-modal");
const placeForm = document.getElementById("place-form");

addPlaceBtn.addEventListener("click", () => {
    placeModal.classList.add("show");
});

closePlaceModalBtn.addEventListener("click", () => {
    placeModal.classList.remove("show");
});

placeModal.addEventListener("click", (e) => {
    if (e.target === placeModal) {
        placeModal.classList.remove("show");
    }
});

// 提交足迹表单
placeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("place-name").value.trim();
    const date = document.getElementById("place-date").value;

    if (!name) {
        alert("请输入城市名称！");
        return;
    }

    if (!cityCoordinates[name]) {
        alert("抱歉，暂时不支持这个城市的坐标，我会尽快添加！");
        return;
    }

    const file = document.getElementById("place-image").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            savePlace(name, date, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        savePlace(name, date, null);
    }
});

// 保存足迹
function savePlace(name, date, image) {
    const places = loadPlaces();
    const newPlace = {
        id: Date.now(),
        name,
        date,
        image
    };

    places.push(newPlace);
    savePlaces(places);
    renderMapMarkers();
    renderMemoryTimeline();
    renderAlbumGrid();

    // 重置表单并关闭弹窗
    placeForm.reset();
    placeModal.classList.remove("show");
}

// 创建相册弹窗控制
const closeAlbumModalBtn = document.getElementById("close-album-modal");
const albumModal = document.getElementById("album-modal");
const albumForm = document.getElementById("album-form");

closeAlbumModalBtn.addEventListener("click", () => {
    albumModal.classList.remove("show");
});

albumModal.addEventListener("click", (e) => {
    if (e.target === albumModal) {
        albumModal.classList.remove("show");
    }
});

// 提交相册表单
albumForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("album-name").value.trim();
    const date = document.getElementById("album-date").value;

    if (!name) {
        alert("请输入相册名称！");
        return;
    }

    const file = document.getElementById("album-cover").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            saveAlbum(name, date, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        saveAlbum(name, date, null);
    }
});

// 保存相册
function saveAlbum(name, date, cover) {
    const albums = loadAlbums();
    const newAlbum = {
        id: Date.now(),
        name,
        date,
        cover,
        photos: []
    };

    albums.push(newAlbum);
    saveAlbums(albums);
    renderMemoryTimeline();
    renderAlbumGrid();

    // 重置表单并关闭弹窗
    albumForm.reset();
    albumModal.classList.remove("show");
}

// 页面加载时渲染回忆页
window.addEventListener("load", () => {
    // 初始化高德地图
    initAMap();
    renderMemoryTimeline();
    renderAlbumGrid();
});

// 切换到回忆页时重新渲染
document.querySelectorAll('.nav-btn[data-page="memory"]').forEach(btn => {
    btn.addEventListener("click", () => {
        setTimeout(initAMap, 100);
        renderMemoryTimeline();
        renderAlbumGrid();
    });
});
// ==================== 首页快捷入口跳转 ====================
document.getElementById("entry-daily").addEventListener("click", () => {
    document.querySelector('.nav-btn[data-page="daily"]').click();
});

document.getElementById("entry-calendar").addEventListener("click", () => {
    document.querySelector('.nav-btn[data-page="calendar"]').click();
});

document.getElementById("entry-wish").addEventListener("click", () => {
    document.querySelector('.nav-btn[data-page="wish"]').click();
});

document.getElementById("entry-memory").addEventListener("click", () => {
    document.querySelector('.nav-btn[data-page="memory"]').click();
});
// ==================== 本地音乐播放器控制 ====================
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
let isPlaying = false;

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        bgMusic.pause();
        musicBtn.classList.remove('playing');
        musicBtn.textContent = '🎵';
    } else {
        bgMusic.play().catch(() => {
            // 处理浏览器自动播放限制
            alert('点击页面任意位置后再点击音乐按钮即可播放');
        });
        musicBtn.classList.add('playing');
        musicBtn.textContent = '⏸️';
    }
    isPlaying = !isPlaying;
});

// 随机生成飘落的爱心
function createFallingHeart() {
    const heart = document.createElement('div');
    heart.className = 'falling-heart';
    heart.innerHTML = '❤️';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (Math.random() * 15 + 10) + 'px';
    heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
    
    document.body.appendChild(heart);
    
    // 动画结束后移除元素
    setTimeout(() => {
        heart.remove();
    }, 10000);
}

// 每2秒生成一个飘落的爱心
setInterval(createFallingHeart, 2000);