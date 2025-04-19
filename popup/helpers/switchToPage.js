export default function switchToPage(page) {
    chrome.tabs.update({
        url: chrome.runtime.getURL(page)
    });
}