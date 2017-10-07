/**
 * Yêu cầu trình duyệt mở Camera + micro
 * @returns {*}
 */
function openStream() {
    const config = { audio: false, video: true };
    return navigator.mediaDevices.getUserMedia(config);
}

/**
 * dùng camera để play video hiển thị lên trình duyệt
 * @param idVideoTag
 * @param stream
 */
function playStream(idVideoTag, stream) {
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}
