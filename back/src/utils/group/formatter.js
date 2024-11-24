class Formatter {
    // 날짜 포맷팅
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 학습 시간 포맷팅 (분 단위를 시간:분 형태로 변환)
    formatStudyTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // 퍼센트 포맷팅
    formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }

    // 점수 포맷팅
    formatScore(score, totalScore) {
        return `${score}/${totalScore} (${(score/totalScore * 100).toFixed(1)}%)`;
    }

    // 전화번호 포맷팅
    formatPhoneNumber(phoneNumber) {
        return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    // 이름 마스킹
    maskName(name) {
        if (name.length <= 2) {
            return name.charAt(0) + '*';
        }
        return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    }

    // 이메일 마스킹
    maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return `${maskedUsername}@${domain}`;
    }

    // 숫자 포맷팅 (천 단위 구분)
    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

module.exports = new Formatter();