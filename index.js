const electron = require("electron");
const fs = require("fs");
const uuid = require("uuid");

const { app, BrowserWindow, Menu, ipcMain } = electron;

let todayWindow;
let createWindow;
let listWindow;

let allAppointments = [];

fs.readFile("db.json", (err, jsonAppointments) => {
  if (!err) {
    const oldAppointments = JSON.parse(jsonAppointments);
    allAppointments = oldAppointments;
  }
});

app.on("ready", () => {
  todayWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    title: "Doctor Appointment"
  });
  todayWindow.loadURL(`file://${__dirname}/today.html`);
  todayWindow.on("closed", () => {
    const jsonAppointments = JSON.stringify(allAppointments);
    fs.writeFileSync("db.json", jsonAppointments);

    app.quit();
    todayWindow = null;
  });

  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);
});

const createWindowCreator = () => {
  createWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 600,
    height: 400,
    title: "Create New Appointment"
  });

  createWindow.setMenu(null);

  createWindow.loadURL(`file://${__dirname}/create.html`);

  createWindow.on("closed", () => (createWindow = null));
};

const listWindowCreator = () => {
  listWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 600,
    height: 400,
    title: "All Appointments"
  });

  listWindow.setMenu(null);

  listWindow.loadURL(`file://${__dirname}/list.html`);

  listWindow.on("closed", () => (listWindow = null));
};

ipcMain.on("appointment:create", (event, appointment) => {
  appointment["id"] = uuid();
  appointment["done"] = 0;
  allAppointments.push(appointment);

  sendTodayAppointments();
  createWindow.close();
});

ipcMain.on("appointment:request:list", event => {
  listWindow.webContents.send("appointment:response:list", allAppointments);
});

ipcMain.on("appointment:request:today", event => {
  sendTodayAppointments();
});

ipcMain.on("appointment:done", (event, id) => {
  allAppointments.forEach(appointment => {
    if (appointment.id === id) appointment.done = 1;
  });

  sendTodayAppointments();
});

const sendTodayAppointments = () => {
  const today = new Date().toISOString().slice(0, 10);
  const filtered = allAppointments.filter(
    appointment => appointment.date === today
  );
  todayWindow.webContents.send("appointment:response:today", filtered);
};

const menuTemplate = [
  {
    label: "File",

    submenu: [
      {
        label: "New Appointment",

        click() {
          createWindowCreator();
        }
      },

      {
        label: "All Appointments",

        click() {
          listWindowCreator();
        }
      },

      {
        label: "Quit",

        accelerator: process.platform === "darwin" ? "Command+Q" : "Ctrl+Q",

        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: "View",
    submenu: [{ role: "reload" }, { role: "toggledevtools" }]
  }
];
