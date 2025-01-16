const generateForm = document.querySelector(".generate-form");
const imageGallery = document.querySelector(".image-gallery");
const token = "_API_KEY"; 
let isImageGenerating = false;
const updateImageCard = (imgDataArray) => {
    imgDataArray.forEach((imgObject, index) => {
        const imgCard = imageGallery.querySelectorAll(".img-card")[index];
        if (!imgCard) return;
        const imgElement = imgCard.querySelector("img");
        const downloadBtn = imgCard.querySelector(".download-btn");
        if (!imgObject || !imgObject.b64_json) {
            console.error("Invalid image object:", imgObject);
            imgElement.src = "Images/error.svg";
            imgCard.classList.remove("loading");
            return;
        }
        imgElement.src = imgObject.b64_json;
        imgElement.onload = () => {
            imgCard.classList.remove("loading");
            downloadBtn.href = imgObject.b64_json;
            downloadBtn.download = `${new Date().getTime()}.jpg`;
        };
        imgElement.onerror = () => {
            console.error("Error loading image:", imgObject);
            imgElement.src = "Images/error.svg";
            imgCard.classList.remove("loading");
        };
    });
};
const generateAiImages = async (userPrompt, userImgQuantity) => {
    try {
        const imagePromises = [];
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        for (let i = 0; i < userImgQuantity; i++) {
            const requestBody = {
                inputs: userPrompt,
                options: { wait_for_model: true }
            };
            const jsonBody = JSON.stringify(requestBody);
            console.log("Request Body:", jsonBody);
            console.log("Token being sent:", token);
            imagePromises.push(
                fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: jsonBody
                })
                .then(async response => {
                    if (!response.ok) {
                        try {
                            const errorData = await response.json();
                            throw new Error(`Failed to generate image: ${response.status} - ${errorData?.error || response.statusText}`);
                        } catch (jsonError) {
                            throw new Error(`Failed to generate image: ${response.status} - ${response.statusText}`);
                        }
                    }
                    return response.blob();
                })
                .then(blob => URL.createObjectURL(blob)) 
            );
            if (i < userImgQuantity - 1) {
                await delay(1000);
            }
        }
        const imageUrls = await Promise.all(imagePromises);
        const imgDataArray = imageUrls.map(imageUrl => ({ b64_json: imageUrl }));
        console.log("All Image URLs:", imageUrls);
        updateImageCard(imgDataArray);
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
    const userImgQuantity = parseInt(e.srcElement[1].value, 10);
    const imgCardMarkup = Array.from({ length: userImgQuantity }, () =>
        `<div class="img-card loading">
            <img src="Images/loader.svg" alt="Generating image...">
            <a href="#" class="download-btn">
                <img src="Images/download.svg" alt="download icon">
            </a>
        </div>`
    ).join("");
    imageGallery.innerHTML = imgCardMarkup;
    generateAiImages(userPrompt, userImgQuantity);
};
generateForm.addEventListener("submit", handleFormSubmission);