let events = [];
let eventsToDisplay = [];

const delay = ms => new Promise(res => setTimeout(res, ms));

window.addEventListener("load", () => {
    BackgroundCheck.init({
        targets: ".bg-check-target",
        images: ".background"
    });

    main()
});

async function main() {
    events = await loadEvents();
    eventsToDisplay = await loadEventsToDisplay();

    setInterval(async () => {
        events = await loadEvents();
        eventsToDisplay = await loadEventsToDisplay();
    }, 5 * 60 * 1000);

    while (true) {
        if (eventsToDisplay.length > 0)
            await displayEvents();
        else
            await delay(1000);
    }
}

async function loadEvents() {
    let r = await fetch("https://api.github.com/repos/cssbristol/cssbristol.github.io/contents/_events");
    let events = await r.json();
    let promises = [];
    for (let event of events) {
        let promise = fetch(event.download_url)
        .then(r => r.text())
        .then(text => {
            event.text = text;
            let data = extractor(event.text);
            event.attributes = data.attributes;
            event.attributes.date = new Date(event.attributes.date);
            event.attributes.date_end = new Date(event.attributes.date_end);
            event.body = data.body;
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    return events;
}

async function loadEventsToDisplay() {
    let eventsToDisplay = [];
    const now = new Date();
    for (let event of events) {
        if (now < event.attributes.date_end) {
            eventsToDisplay.push(event);
        }
    }

    return eventsToDisplay;
}

async function displayEvents() {
    let yetToDisplay = [...eventsToDisplay];
    while (yetToDisplay.length > 0) {
        let event = yetToDisplay.pop();
        displayEvent(event);
        await delay(15 * 1000);
    }
}

function displayEvent(event) {
    const now = new Date();
    let body = document.body;
    let QRCodeElement = document.getElementById("qr-code");
    let eventTitleElement = document.getElementById("event-title");
    let descriptionElement = document.getElementById("description");
    let startingInElement = document.getElementById("starting-in");
    let singleDayContainer = document.getElementById("single-day");
    let multiDayContainer = document.getElementById("multi-day");
    let dateElement = document.getElementById("date");
    let timeElement = document.getElementById("time");
    let startElement = document.getElementById("start-date");
    let endElement = document.getElementById("end-date");
    let locationElement = document.getElementById("location");

    const kioskDefault = {
        background: "https://cssbristol.co.uk/assets/images/contrib/events/" + event.attributes.banner || "assets/default_background.png",
        short_description: event.body.substring(0, 150) + "..." || "",
        kiosk_title: event.attributes.title || "",
        show_sponsors: true,
        show_date: true
    }
    let kioskOptions = {...event.attributes.kiosk, ...kioskDefault};

    body.style.backgroundImage = `url(${kioskOptions.background}), url(default_background.png)`;
   
    eventTitleElement.innerText = kioskOptions.kiosk_title;

    let timeToStart = Math.abs(event.attributes.date - now);
    if (timeToStart < 0) {
        startingInElement.style.display = "";
        startingInElement.innerText = "In progress";
    } else if (timeToStart < 60 * 60 * 1000) {
        startingInElement.style.display = "";
        let minutes = Math.abs(timeToStart / 60 / 1000);
        startingInElement.innerText = `Starting in ${minutes} minute` + (minutes ? "s" : "");
    } else if (timeToStart < 24 * 60 * 60 * 1000) {
        startingInElement.style.display = "";
        let hours = Math.abs(timeToStart / 60 / 60 / 1000);
        startingInElement.innerText = `Starting in ${hours} hours` + (hours ? "s" : "");
    } else {
        startingInElement.style.display = "none";
    }

    let startDate = event.attributes.date.toLocaleDateString("en-GB");
    let endDate = event.attributes.date_end.toLocaleDateString("en-GB");
    let startTime = event.attributes.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(" ", "").toLowerCase();
    let endTime = event.attributes.date_end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(" ", "").toLowerCase();
    if (startDate === endDate) {
        singleDayContainer.style.display = "";
        multiDayContainer.style.display = "none";
        dateElement.innerText = startDate;
        timeElement.innerText = `${startTime} to ${endTime}`;
    } else {
        singleDayContainer.style.display = "none";
        multiDayContainer.style.display = "";
        startElement = `${startDate} ${startTime}`;
        endElement = `${endDate} ${endTime}`;
    }

    locationElement.innerText = event.attributes.location;

    descriptionElement.innerText = kioskOptions.short_description;

    let url = "https://cssbristol.co.uk/events/" + event.name.replace(".md", "");
    QRCodeElement.innerHTML = "";
    new QRCode(QRCodeElement, {
        text: url,
        width: 220,
	    height: 220,
    });

    let img = new Image();
    img.src = kioskOptions.background;
    img.onload = () => {
        BackgroundCheck.refresh();
    }
    if (img.complete) img.onload();
}