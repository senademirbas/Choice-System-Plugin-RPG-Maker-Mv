const fs = require("fs");
const path = require("path");


const dataPath = ".../www/data";
const outputPath = ".../dialogues_FULL.csv";


let csvContent = "KEY;Type;Location;Context;English;Turkish;German;Notes\n";

let textId = 1;
let choiceId = 1;
const seenKeys = new Set();

function formatText(str) {
    if (!str) return "";
    return str
        .replace(/[\x00-\x1F\x7F]/g, "") 
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, "“")
        .replace(/â€/g, "”")
        .replace(/â€¦/g, "…")
        .replace(/"/g, '""')             
        .trim();
}

function addRow(text, fileName, type, location, context) {
    const cleanText = formatText(text);
    if (!cleanText) return;

    const uniqueKey = `${fileName}:${cleanText}`;
    if (seenKeys.has(uniqueKey)) return;
    seenKeys.add(uniqueKey);

    const id = type === "CHOICE" 
        ? `CHO_${String(choiceId++).padStart(4, "0")}` 
        : `TXT_${String(textId++).padStart(4, "0")}`;

    csvContent += `${id};${type};"${location}";"${context}";"${cleanText}";;;\n`;
}

function processCommandList(list, fileName, eventId) {
    if (!list || list.length === 0) return;

    let recentChoices = [];
    let unhandledChoices = [];
    let contextStack = [];
    let textBuffer = [];


    const getCurrentContext = () => {
        const choiceContexts = contextStack.filter(c => c.label.startsWith("Selected:"));
        if (choiceContexts.length > 0) {
            return choiceContexts[choiceContexts.length - 1].label;
        }
        return contextStack.map(c => c.label).join(" > ");
    };

    const locationStr = `${fileName} (Event ${eventId})`;

    const flushTextBuffer = () => {
        if (textBuffer.length > 0) {
            const fullText = textBuffer.join(" "); 
            addRow(fullText, fileName, "TEXT", locationStr, getCurrentContext());
            textBuffer = [];
        }
    };

    list.forEach(cmd => {
        while (contextStack.length > 0 && contextStack[contextStack.length - 1].indent >= cmd.indent) {
            contextStack.pop();
        }

        if (cmd.code !== 401) flushTextBuffer();

        switch (cmd.code) {
            case 356: // ShowVNChoices
                if (cmd.parameters[0].startsWith("ShowVNChoices")) {
                    const choiceStr = cmd.parameters[0].replace("ShowVNChoices", "").trim();
                    if (choiceStr) {
                        recentChoices = choiceStr.split("|");
                        unhandledChoices = [...recentChoices]; // Store choices in memory
                        recentChoices.forEach(choice => {
                            addRow(choice, fileName, "CHOICE", locationStr, "Menu Option");
                        });
                    }
                }
                break;

            case 111:
                let label = "If Condition";
                if (cmd.parameters[0] === 1 && cmd.parameters[1] === 1 && cmd.parameters[2] === 0) {
                    const choiceValue = cmd.parameters[3]; 
                    const choiceIndex = choiceValue - 1;
                    const choiceText = recentChoices[choiceIndex] || `Option ${choiceValue}`;
                    label = `Selected: [${choiceText}]`;
                    

                    unhandledChoices = unhandledChoices.filter(c => c !== choiceText);
                }
                contextStack.push({ indent: cmd.indent, label });
                break;

            case 411: // Else Condition

                if (unhandledChoices.length === 1) {
                    contextStack.push({ indent: cmd.indent, label: `Selected: [${unhandledChoices[0]}]` });
                } else {
                    contextStack.push({ indent: cmd.indent, label: "Other Options" });
                }
                break;

            case 401: // Show Text
                textBuffer.push(cmd.parameters[0]);
                break;
        }
    });

    flushTextBuffer();
}

function processMapFile(fileName) {
    const filePath = path.join(dataPath, fileName);
    const mapData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!mapData.events) return;

    mapData.events.forEach(event => {
        if (event && event.pages) {
            event.pages.forEach(page => {
                processCommandList(page.list, fileName, event.id);
            });
        }
    });
}

fs.readdirSync(dataPath).forEach(file => {
    if (file.startsWith("Map") && file.endsWith(".json")) {
        processMapFile(file);
    }
});

fs.writeFileSync(outputPath, "\uFEFF" + csvContent, "utf8");
console.log(`✅ EXPORT SUCCESSFUL -> ${outputPath}`);