class BackgroundCheck {
    constructor(targetClass, backgroundClass) {
        this.targetClass = targetClass;
        this.backgroundClass = backgroundClass;

        window.addEventListener("resize", () => {
            this.check();
        });

        window.addEventListener("scroll", () => {
            this.check();
        });

        this.check();
    }

    check() {
        // load target elements + bounding area
        // load background elements 
        // load background images + bounding areas
        // create canvas the size of html element and draw images onto them in their bounding areas
        // on each target check average background lightness
        // add class to target based on lightness

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {willReadFrequently: true});
        const body = document.body;
        context.canvas.width = body.clientWidth;
        context.canvas.height = body.clientHeight;

        let backgroundEls = document.getElementsByClassName(this.backgroundClass);
        let backgroundImages = []; // {url, x, y, z}
        for (let bgEl of backgroundEls) {
            let img = this.getImg(bgEl);
            let cssImg = this.getCssImg(bgEl);
            if (img) backgroundImages.push(img);
            if (cssImg) backgroundImages.push(cssImg);
        }
        backgroundImages.sort((a, b) => (a.z || 0) - (b.z || 0))
        let promises = []
        for (let bgImg of backgroundImages) {
            let promise = new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = () => {
                    context.drawImage(img, bgImg.x, bgImg.y);
                    resolve();
                }
                img.crossOrigin = "Anonymous";
                img.src = bgImg.url;
            });
            promises.push(promise);
        }
        
        Promise.all(promises).then(() => {
            console.log(canvas.toDataURL());
        let targetEls = document.getElementsByClassName(this.targetClass);
        for (let targetEl of targetEls) {
            let rect = targetEl.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) {
                continue;
            }

            let x = rect.x + window.scrollX;
            let y = rect.y + window.scrollY;
            let imgd = context.getImageData(x, y, rect.width, rect.height);
            let pix = imgd.data;
            let totalRed = 0;
            let totalGreen = 0;
            let totalBlue = 0;
            for (let i = 0, n = pix.length; i < n; i += 4) {
                totalRed += pix[i]; // red
                totalBlue += pix[i + 1]; // green
                totalGreen += pix[i + 2]; // blue
                // i+3 is alpha (the fourth element)
            }
            let brightness = totalRed * 0.299 + totalGreen * 0.587 + totalBlue * 0.114;
            brightness /= rect.width * rect.height;
            console.log(brightness)

            if (brightness > 100) {
                targetEl.classList.add("light-background");
            } else {
                targetEl.classList.add("dark-background");
            }
        }

        });
    }

    getImg(element) {
        if (element.tagName === "img") {
            let rect = element.getBoundingClientRect();
            let x = rect.x + window.scrollX;
            let y = rect.y + window.scrollY;
            return {
                url: element.src,
                x: x,
                y: y,
                z: element.style.zIndex || 0,
            }
        }

        return null;
    }

    getCssImg(element) {
        let style = element.currentStyle || window.getComputedStyle(element, false);
        let imageUrl = style.backgroundImage.substring(4).replaceAll('"', '').split(")")[0];
        // let px, py = window.getComputedStyle(temp1).backgroundPosition.split();
        // toPx(element, )
        let rect = element.getBoundingClientRect();
        let x = rect.x + window.scrollX;
        let y = rect.y + window.scrollY;
        return {
            url: imageUrl,
            x: x,
            y: y,
            z: element.style.zIndex || 0,
        }
    }
}