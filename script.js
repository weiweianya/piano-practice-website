// =========================
// Today Practice Button
// =========================

const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

startButton.addEventListener("click", function () {

    message.textContent = "🎵 很好！今天的 20 分钟，从现在开始。";

    startButton.textContent = "今天已经开始练习 ✓";

});


// =========================
// Practice Timer
// =========================

const timerDisplay = document.getElementById("timer");

const startTimerButton = document.getElementById("startTimer");
const pauseTimerButton = document.getElementById("pauseTimer");
const resetTimerButton = document.getElementById("resetTimer");
const encouragementMessage = document.getElementById("encouragementMessage");
const totalPracticeDuration = document.getElementById("totalPracticeDuration");
const completedTimerCount = document.getElementById("completedTimerCount");
const practiceProgress = document.getElementById("practiceProgress");
const practiceProgressBar = document.getElementById("practiceProgressBar");
const practiceProgressDetail = document.getElementById("practiceProgressDetail");
const progressTrack = document.querySelector(".progress-track");

const timerDurationMinutes = 20;
const timerDurationSeconds = timerDurationMinutes * 60;
const totalPracticeSecondsKey = "totalPracticeSeconds";

let totalSeconds = timerDurationSeconds;

let timerInterval = null;
let timerState = "idle";
let timerAudioContext = null;


function updateTimerDisplay() {

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");

    const formattedSeconds = String(seconds).padStart(2, "0");

    timerDisplay.textContent =
        `${formattedMinutes}:${formattedSeconds}`;
}


function updateTimerButtonStates() {

    startTimerButton.classList.toggle("is-active", timerState === "running");
    pauseTimerButton.classList.toggle("is-active", timerState === "paused");
}


function prepareTimerSound() {

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    if (timerAudioContext === null) {
        timerAudioContext = new AudioContextClass();
    }

    if (timerAudioContext.state === "suspended") {
        timerAudioContext.resume().catch(function () {});
    }
}


function playTimerCompleteSound() {

    if (timerAudioContext === null) {
        return;
    }

    function playDing() {

        const now = timerAudioContext.currentTime;
        const oscillator = timerAudioContext.createOscillator();
        const gain = timerAudioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        oscillator.connect(gain);
        gain.connect(timerAudioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.7);
    }

    if (timerAudioContext.state === "running") {
        playDing();
    } else {
        timerAudioContext.resume().then(playDing).catch(function () {});
    }
}


function updatePracticeDuration() {

    const completedSessions = Number(localStorage.getItem("completedTimerSessions")) || 0;
    const totalPracticeSeconds = getTotalPracticeSeconds();

    totalPracticeDuration.textContent = formatPracticeDuration(totalPracticeSeconds);
    completedTimerCount.textContent = `已完成 ${completedSessions} 次倒计时`;
}


function getTotalPracticeSeconds() {

    const savedValue = localStorage.getItem(totalPracticeSecondsKey);
    const savedSeconds = Number(savedValue);

    if (savedValue !== null && Number.isFinite(savedSeconds) && savedSeconds >= 0) {
        return savedSeconds;
    }

    // Preserve statistics saved by older versions, which only stored full sessions.
    const completedSessions = Number(localStorage.getItem("completedTimerSessions")) || 0;
    const migratedSeconds = completedSessions * timerDurationSeconds;

    localStorage.setItem(totalPracticeSecondsKey, String(migratedSeconds));

    return migratedSeconds;
}


function formatPracticeDuration(totalSeconds) {

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];

    if (hours > 0) {
        parts.push(`${hours} 小时`);
    }

    if (minutes > 0 || hours === 0) {
        parts.push(`${minutes} 分钟`);
    }

    if (seconds > 0) {
        parts.push(`${seconds} 秒`);
    }

    return parts.join(" ");
}


function recordPracticeSecond() {

    const totalPracticeSeconds = getTotalPracticeSeconds() + 1;

    localStorage.setItem(totalPracticeSecondsKey, String(totalPracticeSeconds));
    updatePracticeDuration();
}


function recordCompletedTimer() {

    const completedSessions = Number(localStorage.getItem("completedTimerSessions")) || 0;

    localStorage.setItem("completedTimerSessions", String(completedSessions + 1));
    updatePracticeDuration();
}


function updatePracticeProgress() {

    const completedDays = Array.from(document.querySelectorAll(".practice-card")).filter(function (card) {
        return localStorage.getItem("practiceCompleted" + card.dataset.day) === "true";
    }).length;

    practiceProgress.textContent = `${completedDays}/7`;
    practiceProgressBar.style.width = `${(completedDays / 7) * 100}%`;
    practiceProgressDetail.textContent = `已完成 ${completedDays} 天`;
    progressTrack.setAttribute("aria-valuenow", String(completedDays));
}


function startPracticeTimer() {

    if (timerState === "running") {
        return;
    }

    prepareTimerSound();

    if (totalSeconds === 0) {
        totalSeconds = timerDurationSeconds;
        updateTimerDisplay();
    }

    timerState = "running";
    updateTimerButtonStates();

    timerInterval = setInterval(function () {

        totalSeconds--;
        recordPracticeSecond();

        updateTimerDisplay();

        if (totalSeconds === 0) {

            clearInterval(timerInterval);

            timerInterval = null;
            timerState = "idle";
            updateTimerButtonStates();

            recordCompletedTimer();
            playTimerCompleteSound();

        }

    }, 1000);
}


startTimerButton.addEventListener("click", function () {

    startPracticeTimer();

});


pauseTimerButton.addEventListener("click", function () {

    if (timerState !== "running") {
        return;
    }

    clearInterval(timerInterval);

    timerInterval = null;
    timerState = "paused";
    updateTimerButtonStates();

});


function resetPracticeTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
    timerState = "idle";
    updateTimerButtonStates();

    totalSeconds = timerDurationSeconds;

    updateTimerDisplay();
}


resetTimerButton.addEventListener("click", function () {

    resetPracticeTimer();
});


updateTimerDisplay();
updateTimerButtonStates();
updatePracticeDuration();
updatePracticeProgress();


// =========================
// Practice Card Modal
// =========================

const practiceCards = document.querySelectorAll(".practice-card");

const practiceModal = document.getElementById("practiceModal");

const modalContent = practiceModal.querySelector(".modal-content");

const closeModalButton = document.getElementById("closeModal");

const maximizeModalButton = document.getElementById("maximizeModal");

const repeatPracticeButton = document.getElementById("repeatPracticeButton");

const modalDay = document.getElementById("modalDay");

const modalTitle = document.getElementById("modalTitle");

const modalPractice = document.getElementById("modalPractice");

const modalTime = document.getElementById("modalTime");

const modalSteps = document.getElementById("modalSteps");

const modalTip = document.getElementById("modalTip");

const modalVideo = document.getElementById("modalVideo");
const modalVideoSource = document.getElementById("modalVideoSource");
      const videoComingSoon = document.getElementById("videoComingSoon");
      
      let currentDay = null;

      let currentCard = null;
      

modalVideo.addEventListener("error", function () {

    modalVideo.style.display = "none";
    videoComingSoon.style.display = "block";

});

const practiceData = {

    1: {
        day: "DAY 01",
        title: "认识你的钢琴",
        practice: "找到中央 C，并熟悉钢琴键盘的位置。",
        time: "15–20 分钟",
        steps: "找到中央 C → 找到右边的 D、E、F、G → 用右手依次弹奏 C-D-E-F-G。",
        tip: "今天不需要追求速度。先让自己熟悉琴键的位置。",
        video: "videos/day1.mp4",
        hasVideo: true
    },
    

    2: {
        day: "DAY 02",
        title: "手指独立练习",
        practice: "练习五指位置，让每根手指逐渐学会独立运动。",
        time: "20 分钟",
        steps: "右手放在 C-D-E-F-G → 慢慢弹奏 1-2-3-4-5 → 再从 5-4-3-2-1 返回。",
        tip: "保持手腕放松，不要为了弹快而用力。",
        video: "videos/day2.mp4",
        hasVideo: true
    },

    3: {
        day: "DAY 03",
        title: "认识节奏",
        practice: "学习保持稳定的节奏，并尝试跟着节拍弹奏。",
        time: "20 分钟",
        steps: "先用手拍出稳定节拍 → 数 1-2-3-4 → 再用一个音跟着节拍弹奏。",
        tip: "如果节奏不稳定，可以先不弹琴，只拍手练习。",
        video: "videos/day3.mp4",
        hasVideo: true
    },

    4: {
        day: "DAY 04",
        title: "学习一小段旋律",
        practice: "选择一首简单的曲子，只学习其中一小段。",
        time: "20 分钟",
        steps: "选择 4–8 小节 → 右手慢速练习 → 分小段重复 → 最后尝试连接起来。",
        tip: "不要一次练完整首曲子，小目标更容易坚持。",
        video: "videos/day4.mp4",
        hasVideo: true
    },

    5: {
        day: "DAY 05",
        title: "慢慢弹，弹准确",
        practice: "降低速度，把注意力放在准确性和放松上。",
        time: "20 分钟",
        steps: "把练习速度降低 → 找出容易出错的位置 → 单独重复这些小节 → 再连接起来。",
        tip: "慢练并不是退步，而是在建立稳定的肌肉记忆。",
        video: "videos/day5.mp4",
        hasVideo: true
    },

    6: {
        day: "DAY 06",
        title: "完整弹一遍",
        practice: "把这一周练习过的内容连接起来。",
        time: "20 分钟",
        steps: "先慢速弹一遍 → 找出最困难的部分 → 单独练习 → 再完整弹一次。",
        tip: "今天的目标不是完美，而是把练习完成。",
        video: "videos/day6.mp4",
        hasVideo: true
    },

    7: {
        day: "DAY 07",
        title: "回顾你的进步",
        practice: "重新弹奏这一周的内容，并观察自己的变化。",
        time: "20 分钟",
        steps: "完整弹奏一次 → 回想 Day 1 的状态 → 找出自己最大的进步 → 写下一句话记录。",
        tip: "记录进步会让你更容易坚持下一周的练习。",
        video: "videos/day7.mp4"
    }

};

const encouragements = [
    "很好",
    "真棒",
    "继续加油",
    "今天又是充实的一天"
];



// Open modal

practiceCards.forEach(function (card) {

    card.addEventListener("click", function () {

        const day = card.dataset.day;

        const data = practiceData[day];

        currentDay = day;

        currentCard = card;
        const completionStatus = currentCard.querySelector(".completion-status");


    

    if (localStorage.getItem("practiceCompleted" + currentDay) === "true") {

    completePracticeButton.textContent = "✓ 已完成";

} else {

    completePracticeButton.textContent = "✓ 完成今天的练习";

}

        modalDay.textContent = data.day;

        modalTitle.textContent = data.title;

        modalPractice.textContent = data.practice;

        modalTime.textContent = data.time;

        modalSteps.textContent = data.steps;

        modalTip.textContent = data.tip;

    



if (data.hasVideo === true) {

    modalVideo.style.display = "block";
    videoComingSoon.style.display = "none";

    modalVideoSource.src = data.video;
    modalVideo.load();

} else {

    modalVideo.style.display = "none";
    videoComingSoon.style.display = "block";

}


practiceModal.classList.add("show");
        modalVideoSource.src = data.video;
        modalVideo.load();

        if (data.hasVideo === true) {
            const playPromise = modalVideo.play();

            if (playPromise !== undefined) {
                playPromise.catch(function () {
                    // The browser may still block playback in some contexts.
                });
            }
        }

    

    });

});

completePracticeButton.addEventListener("click", function () {

    if (localStorage.getItem("practiceCompleted" + currentDay) === "true") {
    return;
}


    
    completePracticeButton.textContent = "✓ 已完成";

    localStorage.setItem("practiceCompleted" + currentDay, "true");

  currentCard.classList.add("completed-page");
  currentCard.querySelector(".completion-status").textContent = "✓ 已完成";
  updatePracticeProgress();

  const randomIndex = Math.floor(Math.random() * encouragements.length);

const randomMessage = encouragements[randomIndex];

encouragementMessage.textContent = randomMessage;

setTimeout(function () {
    encouragementMessage.textContent = "";
}, 2000);

});


repeatPracticeButton.addEventListener("click", function () {

    if (timerState === "idle") {
        resetPracticeTimer();
        startPracticeTimer();
    } else if (timerState === "paused") {
        startPracticeTimer();
    }

    modalVideo.pause();
    document.querySelector(".timer-section").scrollIntoView({ behavior: "smooth", block: "center" });

});


// Close modal with X

closeModalButton.addEventListener("click", function () {

    modalVideo.pause();
    practiceModal.classList.remove("show");

});


maximizeModalButton.addEventListener("click", function () {

    const isMaximized = modalContent.classList.toggle("is-maximized");

    maximizeModalButton.textContent = isMaximized ? "↙" : "⛶";
    maximizeModalButton.setAttribute("aria-label", isMaximized ? "Restore window" : "Maximize window");
    maximizeModalButton.title = isMaximized ? "Restore window" : "Maximize window";

});


// Close modal by clicking background

practiceModal.addEventListener("click", function (event) {

    if (event.target === practiceModal) {

        modalVideo.pause();
        practiceModal.classList.remove("show");

    }

});

const completionStatuses = document.querySelectorAll(".completion-status");


completionStatuses.forEach(function (status) {

    const day = status.dataset.completionDay;

    const completed = localStorage.getItem(
        "practiceCompleted" + day
    );

    if (completed === "true") {

        status.textContent = "✓ 已完成";

    }

});

window.addEventListener("load", function () {

    practiceCards.forEach(function (card) {
        const day = card.dataset.day;

        if (localStorage.getItem("practiceCompleted" + day) === "true") {
            card.classList.add("completed-page");
        }
    });


});
