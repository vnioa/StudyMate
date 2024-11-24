class StudyTimer {
    constructor() {
        this.timerId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isRunning = false;
    }

    // 타이머 시작
    start(callback) {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.pausedTime;
            this.isRunning = true;
            this.timerId = setInterval(() => {
                const currentTime = this.getElapsedTime();
                callback(currentTime);
            }, 1000);
        }
    }

    // 타이머 일시정지
    pause() {
        if (this.isRunning) {
            clearInterval(this.timerId);
            this.pausedTime = Date.now() - this.startTime;
            this.isRunning = false;
        }
    }

    // 타이머 재개
    resume(callback) {
        this.start(callback);
    }

    // 타이머 초기화
    reset() {
        clearInterval(this.timerId);
        this.startTime = null;
        this.pausedTime = 0;
        this.isRunning = false;
    }

    // 경과 시간 계산
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    // 포모도로 타이머 설정
    setPomodoroTimer(duration, breakTime, onWorkComplete, onBreakComplete) {
        let isWorkTime = true;

        const startPomodoro = () => {
            if (isWorkTime) {
                this.startCountdown(duration * 60, (timeLeft) => {
                    if (timeLeft === 0) {
                        onWorkComplete();
                        isWorkTime = false;
                        this.startCountdown(breakTime * 60, (breakTimeLeft) => {
                            if (breakTimeLeft === 0) {
                                onBreakComplete();
                                isWorkTime = true;
                                startPomodoro();
                            }
                        });
                    }
                });
            }
        };

        startPomodoro();
    }

    // 카운트다운 타이머
    startCountdown(seconds, callback) {
        let remainingTime = seconds;

        this.timerId = setInterval(() => {
            remainingTime--;
            callback(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(this.timerId);
            }
        }, 1000);
    }

    // 타이머 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            elapsedTime: this.getElapsedTime(),
            pausedTime: this.pausedTime
        };
    }
}

module.exports = new StudyTimer();