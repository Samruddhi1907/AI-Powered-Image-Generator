const generateForm = document.querySelector(".generate-form");
const imageGallery = document.querySelector(".image-gallery");
const actionButtons = document.querySelector(".action-buttons");
const editBtn = document.querySelector(".edit-btn");
const feedbackOverlay = document.querySelector(".feedback-overlay");
const closeButton = document.querySelector(".close-button");
const token = "YOUR_API_KEY";
let isImageGenerating = false;
let currentImage = null;
actionButtons.style.display = "none";
feedbackOverlay.style.display = "none"; 
const updateImageCard = (imgURL) => {
    console.log("updateImageCard called with imgURL:", imgURL);
    console.log("Type of imgURL:", typeof imgURL);
    console.log("Is imgURL truthy?", !!imgURL);
    imageGallery.innerHTML = "";
    const imgCard = document.createElement("div");
    imgCard.classList.add("img-card", "loading");
    imgCard.innerHTML = `
        <img src="Images/loader.svg" alt="Generating image...">
        <a href="#" class="download-btn">
            <img src="Images/download.svg" alt="download icon">
        </a>
    `;
    imageGallery.appendChild(imgCard);
    const imgElement = imgCard.querySelector("img");
    const downloadBtn = imgCard.querySelector(".download-btn");
    imgElement.onload = () => {
        imgCard.classList.remove("loading");
        downloadBtn.href = imgURL;
        downloadBtn.download = `generated_image_${Date.now()}.png`;
        currentImage = imgURL;
        updateActionButtons();
        setTimeout(() => {
            feedbackOverlay.style.display = 'flex';
        }, 4000);
    };
    imgElement.onerror = (error) => {
        console.error("Error loading image:", error);
        imgElement.src = "Images/error.svg";
        imgCard.classList.remove("loading");
    };
    imgElement.src = imgURL;
};
const generateAiImages = async (userPrompt) => {
    try {
        const requestBody = {
            inputs: userPrompt,
            options: { wait_for_model: true }
        };
        const jsonBody = JSON.stringify(requestBody);
        const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: jsonBody
        });
        if (!response.ok) {
            const contentType = response.headers.get("Content-Type");
            let errorMessage = `API Error: ${response.status}`;
            if (contentType && contentType.includes("application/json")) {
                try {
                    const errorData = await response.json();
                    errorMessage += ` - ${errorData.error}`;
                    console.error("Hugging Face API Error (JSON):", response.status, errorData);
                } catch (jsonError) {
                    console.error("Error parsing JSON error:", jsonError);
                }
            } else {
                try {
                    const errorText = await response.text();
                    errorMessage += ` - ${errorText}`;
                    console.error("Hugging Face API Error (Text):", response.status, errorText);
                } catch (textError) {
                    console.error("Error parsing text error:", textError)
                }
            }
            alert(errorMessage);
            return;
        }
        const blob = await response.blob();
        console.log("Blob:", blob);
        const imageUrl = URL.createObjectURL(blob);
        console.log("Image URL:", imageUrl);
        updateImageCard(imageUrl);
    } catch (error) {
        console.error("Fetch Error:", error);
        alert(error.message);
    } finally {
        isImageGenerating = false;
    }
};
const handleFormSubmission = (e) => {
    e.preventDefault();
    if (isImageGenerating) return;
    isImageGenerating = true;
    const userPrompt = e.srcElement[0].value;
    console.log("Form submitted with prompt:", userPrompt);
    imageGallery.innerHTML = `<div class="img-card loading">
        <img src="Images/loader.svg" alt="Generating image...">
        <a href="#" class="download-btn">
            <img src="Images/download.svg" alt="download icon">
        </a>
    </div>`;
    generateAiImages(userPrompt);
};
const updateActionButtons = () => {
    if (currentImage) {
        actionButtons.style.display = "flex";
        editBtn.disabled = false;

        editBtn.onclick = () => {
            localStorage.setItem("selectedImage", currentImage);
            window.location.href = "edit.html";
        };
    } else {
        actionButtons.style.display = "none";
        editBtn.disabled = true;
        editBtn.onclick = null;
    }
};
console.log("generateForm:", generateForm);
if (generateForm) {
    generateForm.addEventListener("submit", handleFormSubmission);
} else {
    console.error("generateForm element not found!");
}
closeButton.addEventListener('click', () => {
    feedbackOverlay.style.display = 'none';
}); 
const feedbackBtn = document.querySelector('.feedback-btn');
feedbackBtn.addEventListener('click', () => {
  window.location.href = "feedback.html"; 
});
