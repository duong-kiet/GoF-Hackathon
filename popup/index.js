import switchToPage from "./helpers/switchToPage.js";

const orginalHeight = document.body.offsetHeight
chrome.runtime.sendMessage({ action: 'resizeWindow', orginalHeight });

const container = document.querySelector('.container');
const options = document.querySelector('.options');
const optionButtons = document.querySelectorAll('.option-button');

// Tạo loading indicator
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.display = 'none';
loadingIndicator.style.position = 'fixed';
loadingIndicator.style.top = '50%';
loadingIndicator.style.left = '50%';
loadingIndicator.style.transform = 'translate(-50%, -50%)';
loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
loadingIndicator.style.color = 'white';
loadingIndicator.style.padding = '20px';
loadingIndicator.style.borderRadius = '8px';
loadingIndicator.style.zIndex = '1000';
loadingIndicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
        <span style="font-size: 18px">Đang xử lý...</span>
    </div>
`;

document.body.appendChild(loadingIndicator);

// Hàm hiển thị/ẩn loading indicator
function showLoading() {
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

optionButtons.forEach(button => {
    button.addEventListener('click', function() {
        optionButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        if (button.getAttribute("value") !== "both") {
            const buttonNotSupport = document.createElement('button');
            buttonNotSupport.style = "width: 100%; margin-top: 40px";
            buttonNotSupport.innerText = "❌ Không hỗ trợ";
            if (container.lastChild?.nodeType === 1 && container.lastChild.tagName === 'BUTTON') {
                container.removeChild(container.lastChild);
            }
            container.appendChild(buttonNotSupport);

            chrome.runtime.sendMessage({ action: 'resizeWindow', height: 538 });
            
            return;
        }

        const buttonRecord = document.createElement('button');
        buttonRecord.style = "width: 100%; margin-top: 40px";
        buttonRecord.innerText = "🔴 Ghi hình";
        buttonRecord.classList.add('detect-page')
        button.setAttribute("visited", true);

        if (container.lastChild?.nodeType === 1 && container.lastChild.tagName === 'BUTTON') {
            container.removeChild(container.lastChild);
        }

        container.appendChild(buttonRecord);

        chrome.runtime.sendMessage({ action: 'resizeWindow', height: 538 });

        buttonRecord.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'resizeWindow', height: 600 });
            switchToPage('popup/detect.html');
        });
    });
});
  
  
  