// chrome.action.onClicked.addListener(() => {
//   chrome.windows.create({ 
//     url: "popup/index.html",
//     type: "popup",
//     width: 800,
//     height: 438 // Chiều cao tạm thời
//   }, (window) => {
//     // Lưu ID của cửa sổ để dùng sau
//     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//       if (message.action === 'resizeWindow') {
//         chrome.windows.update(window.id, { height: message.height });
//       }
//     });
//   });
// });

chrome.action.onClicked.addListener(() => {
  // Lấy thông tin màn hình (nếu cần thiết)
  chrome.system.display.getInfo((displays) => {
    // Lấy chiều rộng màn hình chính
    const primaryDisplay = displays.find(display => display.isPrimary) || displays[0];
    const screenWidth = primaryDisplay.bounds.width;

    // Định nghĩa kích thước và vị trí cửa sổ
    const windowWidth = 800;
    const windowHeight = 438; // Chiều cao tạm thời
    const leftPosition = screenWidth - windowWidth - 10; 
    const topPosition = 30; 

    chrome.windows.create({
      url: "popup/index.html",
      type: "popup",
      width: windowWidth,
      height: windowHeight,
      left: leftPosition,
      top: topPosition
    }, (window) => {
      // Lưu ID của cửa sổ để dùng sau
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'resizeWindow') {
          chrome.windows.update(window.id, { height: message.height });
        }
      });
    });
  });
});