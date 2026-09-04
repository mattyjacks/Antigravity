/*
 * vibeoVideo - OpenAI AI Studio for Shotcut
 * Video Filter powered by OpenAI GPT-4o & DALL-E 3
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.LocalStorage
import Shotcut.Controls as Shotcut
import org.shotcut.qml as Shotcut
import "OpenAiClient.js" as OpenAiClient
import "vibeoStorage.js" as VibeoStorage

Shotcut.KeyframableFilter {
    id: vibeoRoot

    function setControls() {
        textArea.text = filter.get('argument');
        textFilterUi.setControls();
    }

    keyframableParameters: ['fgcolour', 'olcolour', 'bgcolour', 'opacity']
    startValues: [Qt.rgba(1, 1, 1, 1), Qt.rgba(0, 0, 0, 2.0 / 3.0), Qt.rgba(0, 0, 0, 0), 0.0]
    middleValues: [Qt.rgba(1, 1, 1, 1), Qt.rgba(0, 0, 0, 2.0 / 3.0), Qt.rgba(0, 0, 0, 0), 1.0]
    endValues: [Qt.rgba(1, 1, 1, 1), Qt.rgba(0, 0, 0, 2.0 / 3.0), Qt.rgba(0, 0, 0, 0), 0.0]

    width: 440
    height: 720

    property string userApiKey: ""
    property bool isGeneratingText: false
    property bool isGeneratingImage: false
    property string statusMessage: ""
    property bool statusIsError: false

    Component.onCompleted: {
        filter.blockSignals = true;
        filter.set(textFilterUi.middleValue, Qt.rect(0, 0, profile.width, profile.height));
        filter.set(textFilterUi.startValue, Qt.rect(0, 0, profile.width, profile.height));
        filter.set(textFilterUi.endValue, Qt.rect(0, 0, profile.width, profile.height));

        if (filter.isNew) {
            var presetParams = preset.parameters.slice();
            var index = presetParams.indexOf('argument');
            if (index > -1)
                presetParams.splice(index, 1);

            if (application.OS === 'Windows')
                filter.set('family', 'Segoe UI');
            else if (application.OS === 'macOS')
                filter.set('family', "Helvetica Neue");
            else
                filter.set('family', "Sans-Serif");

            filter.set('fgcolour', '#ffffffff');
            filter.set('bgcolour', '#c8000000');
            filter.set('olcolour', '#ff000000');
            filter.set('opacity', 1.0);
            filter.set('outline', 3);
            filter.set('weight', Font.Bold);
            filter.set('style', 'normal');
            filter.set(textFilterUi.useFontSizeProperty, false);
            filter.set('size', profile.height);
            // Default position: Clean Lower-Third centered box
            filter.set(textFilterUi.rectProperty, '10%/75%:80%x15%');
            filter.set(textFilterUi.valignProperty, 'middle');
            filter.set(textFilterUi.halignProperty, 'center');
            filter.set('pad', 12);
        } else {
            if (filter.get('opacity') === null)
                filter.set('opacity', 1.0);
            filter.set(textFilterUi.middleValue, filter.getRect(textFilterUi.rectProperty, filter.animateIn + 1));
            if (filter.animateIn > 0)
                filter.set(textFilterUi.startValue, filter.getRect(textFilterUi.rectProperty, 0));
            if (filter.animateOut > 0)
                filter.set(textFilterUi.endValue, filter.getRect(textFilterUi.rectProperty, filter.duration - 1));
        }

        filter.blockSignals = false;
        setControls();

        // Initialize persistent settings and load saved API key
        VibeoStorage.initDb();
        var savedKey = VibeoStorage.loadSetting("openai_api_key", "");
        if (savedKey && savedKey.length > 0) {
            vibeoRoot.userApiKey = savedKey;
            apiKeyInput.text = savedKey;
            keyStatusLabel.text = "Key loaded from settings (" + savedKey.substring(0, 7) + "..." + savedKey.substring(savedKey.length - 4) + ")";
        } else {
            keyStatusLabel.text = "No API key found. Enter your OpenAI key in Settings.";
        }

        var savedModel = VibeoStorage.loadSetting("openai_model", "gpt-4o-mini");
        if (savedModel === "gpt-4o") modelCombo.currentIndex = 1;
        else if (savedModel === "gpt-3.5-turbo") modelCombo.currentIndex = 2;
        else modelCombo.currentIndex = 0;
    }

    function generateAiText() {
        if (!vibeoRoot.userApiKey || vibeoRoot.userApiKey.trim() === "") {
            statusIsError = true;
            statusMessage = "Please configure your OpenAI API Key in the 'Settings' tab first.";
            mainTabNav.currentIndex = 3;
            return;
        }

        var topic = topicInput.text.trim();
        if (topic === "") {
            statusIsError = true;
            statusMessage = "Please enter a topic or context above.";
            return;
        }

        isGeneratingText = true;
        statusIsError = false;
        statusMessage = "Generating with OpenAI " + modelCombo.currentText + "...";

        var mode = modeCombo.currentValue;
        var tone = toneCombo.currentText;
        var model = modelCombo.currentValue;

        var systemPrompt = "You are vibeoVideo, an expert video editor AI assistant. Generate concise, punchy text formatted specifically for on-screen video graphics (titles, lower thirds, captions). Do not use quotation marks around the output. Do not include markdown codeblocks or conversational filler.";
        var userPrompt = "";

        if (mode === "title") {
            userPrompt = "Generate 1 punchy, high-impact video title in a " + tone + " tone for this video topic: " + topic;
        } else if (mode === "hook") {
            userPrompt = "Generate 1 engaging opening video hook sentence in a " + tone + " tone to capture viewer attention in the first 3 seconds for this topic: " + topic;
        } else if (mode === "lower_third") {
            userPrompt = "Format a 2-line lower third graphic for video based on this info: " + topic + "\nLine 1: Name or Primary Heading\nLine 2: Title, Role, or Subtext\nReturn only the two lines separated by a newline.";
        } else if (mode === "summary") {
            userPrompt = "Write a concise 1-sentence on-screen summary or takeaway caption in a " + tone + " tone about: " + topic;
        } else if (mode === "cta") {
            userPrompt = "Write a catchy call to action for the video viewer in a " + tone + " tone (e.g. subscribe, link in description, join community) for: " + topic;
        } else if (mode === "translate") {
            var lang = langCombo.currentText;
            userPrompt = "Translate the following video caption or script accurately and naturally into " + lang + ":\n" + topic;
        } else {
            userPrompt = topic;
        }

        OpenAiClient.chatCompletion(
            vibeoRoot.userApiKey,
            model,
            systemPrompt,
            userPrompt,
            0.7,
            300,
            function(err, text) {
                isGeneratingText = false;
                if (err) {
                    statusIsError = true;
                    statusMessage = "Error: " + err.message;
                } else {
                    statusIsError = false;
                    statusMessage = "✨ Successfully generated text!";
                    textArea.text = text;
                    filter.set('argument', text);
                }
            }
        );
    }

    function generateDalleImage() {
        if (!vibeoRoot.userApiKey || vibeoRoot.userApiKey.trim() === "") {
            statusIsError = true;
            statusMessage = "Please enter your OpenAI API Key in the 'Settings' tab first.";
            mainTabNav.currentIndex = 3;
            return;
        }

        var prompt = imgPromptInput.text.trim();
        if (prompt === "") {
            statusIsError = true;
            statusMessage = "Please enter an image prompt.";
            return;
        }

        isGeneratingImage = true;
        statusIsError = false;
        statusMessage = "Generating DALL-E 3 visual (this may take ~15-30s)...";

        var fullPrompt = prompt;
        var style = imgStyleCombo.currentValue;
        if (style !== "none") {
            fullPrompt += ", " + style;
        }

        var size = imgSizeCombo.currentValue;
        var quality = imgQualityCombo.currentValue;

        OpenAiClient.generateImage(
            vibeoRoot.userApiKey,
            fullPrompt,
            size,
            quality,
            "vivid",
            function(err, url, revisedPrompt) {
                isGeneratingImage = false;
                if (err) {
                    statusIsError = true;
                    statusMessage = "DALL-E Error: " + err.message;
                } else {
                    statusIsError = false;
                    statusMessage = "🎨 DALL-E 3 image generated successfully!";
                    dallePreview.source = url;
                    dalleRevisedLabel.text = "Prompt: " + revisedPrompt;
                    dalleResultBox.visible = true;
                }
            }
        );
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 6
        spacing: 6

        // Header Card
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 52
            radius: 6
            color: "#1e1b2e"
            border.color: "#6366f1"
            border.width: 1

            RowLayout {
                anchors.fill: parent
                anchors.margins: 8
                spacing: 8

                Rectangle {
                    width: 34
                    height: 34
                    radius: 6
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: "#6366f1" }
                        GradientStop { position: 1.0; color: "#a855f7" }
                    }

                    Label {
                        anchors.centerIn: parent
                        text: "✨"
                        font.pixelSize: 18
                    }
                }

                ColumnLayout {
                    spacing: 1
                    Layout.fillWidth: true

                    Label {
                        text: "vibeoVideo"
                        font.pixelSize: 14
                        font.bold: true
                        color: "#ffffff"
                    }

                    Label {
                        text: "AI Video Copilot (GPT-4o & DALL-E 3)"
                        font.pixelSize: 10
                        color: "#a5b4fc"
                    }
                }

                Rectangle {
                    width: 72
                    height: 22
                    radius: 11
                    color: vibeoRoot.userApiKey ? "#065f46" : "#7f1d1d"

                    Label {
                        anchors.centerIn: parent
                        text: vibeoRoot.userApiKey ? "● Connected" : "● No Key"
                        font.pixelSize: 9
                        font.bold: true
                        color: vibeoRoot.userApiKey ? "#34d399" : "#f87171"
                    }
                }
            }
        }

        // Tab Navigation
        TabBar {
            id: mainTabNav
            Layout.fillWidth: true
            currentIndex: 0

            TabButton {
                text: "✍️ AI Text"
                font.pixelSize: 11
            }
            TabButton {
                text: "🎨 DALL-E 3"
                font.pixelSize: 11
            }
            TabButton {
                text: "📐 Style & Layout"
                font.pixelSize: 11
            }
            TabButton {
                text: "⚙️ Settings"
                font.pixelSize: 11
            }
        }

        // Status banner
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: statusMessage ? 28 : 0
            visible: statusMessage !== ""
            radius: 4
            color: statusIsError ? "#450a0a" : "#064e3b"
            border.color: statusIsError ? "#dc2626" : "#059669"
            border.width: 1

            Label {
                anchors.centerIn: parent
                text: statusMessage
                color: statusIsError ? "#fca5a5" : "#6ee7b7"
                font.pixelSize: 11
                elide: Text.ElideRight
                width: parent.width - 16
                horizontalAlignment: Text.AlignHCenter
            }
        }

        // Stacked View
        StackLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            currentIndex: mainTabNav.currentIndex

            // ==========================================
            // TAB 0: AI TEXT & TITLES
            // ==========================================
            ScrollView {
                clip: true
                ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

                ColumnLayout {
                    width: parent.width
                    spacing: 8

                    GridLayout {
                        columns: 2
                        Layout.fillWidth: true
                        rowSpacing: 6
                        columnSpacing: 8

                        Label {
                            text: qsTr("Mode:")
                            font.bold: true
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: modeCombo
                            Layout.fillWidth: true
                            textRole: "text"
                            valueRole: "value"
                            model: ListModel {
                                ListElement { text: "🔥 Viral Video Title"; value: "title" }
                                ListElement { text: "🪝 3-Second Opening Hook"; value: "hook" }
                                ListElement { text: "🏷️ Lower Third (Name & Role)"; value: "lower_third" }
                                ListElement { text: "📝 Scene Caption & Summary"; value: "summary" }
                                ListElement { text: "📢 Call to Action (CTA)"; value: "cta" }
                                ListElement { text: "🌐 Language Translator"; value: "translate" }
                                ListElement { text: "💬 Custom AI Prompt"; value: "custom" }
                            }
                        }

                        Label {
                            text: qsTr("Tone:")
                            font.bold: true
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: toneCombo
                            Layout.fillWidth: true
                            model: ["Engaging & Trendy", "Professional & Clean", "Cinematic & Dramatic", "Casual & Humorous", "High-Energy & Urgent", "Minimalist"]
                        }

                        Label {
                            text: qsTr("Language:")
                            font.bold: true
                            Layout.alignment: Qt.AlignRight
                            visible: modeCombo.currentValue === "translate"
                        }

                        ComboBox {
                            id: langCombo
                            Layout.fillWidth: true
                            visible: modeCombo.currentValue === "translate"
                            model: ["Spanish", "French", "German", "Japanese", "Chinese (Mandarin)", "Italian", "Portuguese", "Korean", "English", "Russian", "Hindi"]
                        }

                        Label {
                            text: qsTr("Model:")
                            font.bold: true
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: modelCombo
                            Layout.fillWidth: true
                            textRole: "text"
                            valueRole: "value"
                            model: ListModel {
                                ListElement { text: "gpt-4o-mini (Fast & Recommended)"; value: "gpt-4o-mini" }
                                ListElement { text: "gpt-4o (Highest Intelligence)"; value: "gpt-4o" }
                                ListElement { text: "gpt-3.5-turbo (Legacy)"; value: "gpt-3.5-turbo" }
                            }
                        }
                    }

                    Label {
                        text: qsTr("Topic / Prompt / Scene Context:")
                        font.bold: true
                    }

                    TextField {
                        id: topicInput
                        Layout.fillWidth: true
                        placeholderText: modeCombo.currentValue === "translate" ? "Enter text to translate..." : "e.g. Tech reviewer explaining why new camera sensor is a game changer"
                        selectByMouse: true
                    }

                    Button {
                        Layout.fillWidth: true
                        text: isGeneratingText ? "Generating AI Content..." : "✨ Generate with vibeoVideo"
                        enabled: !isGeneratingText
                        highlighted: true
                        onClicked: generateAiText()
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#374151"
                        Layout.topMargin: 4
                        Layout.bottomMargin: 4
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        Label {
                            text: qsTr("Video Text Output (Live on Screen):")
                            font.bold: true
                            Layout.fillWidth: true
                        }

                        Button {
                            text: qsTr("Clear")
                            font.pixelSize: 10
                            onClicked: {
                                textArea.text = "";
                                filter.set('argument', "");
                            }
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 110
                        color: "#111827"
                        border.color: "#4b5563"
                        border.width: 1
                        radius: 4

                        ScrollView {
                            anchors.fill: parent
                            anchors.margins: 4
                            clip: true

                            TextArea {
                                id: textArea
                                placeholderText: qsTr("AI generated text will appear here and render onto your video...")
                                wrapMode: TextEdit.Wrap
                                selectByMouse: true
                                font.pixelSize: 13
                                color: "#f3f4f6"
                                onTextChanged: {
                                    if (text !== '__empty__') {
                                        filter.set('argument', text);
                                    }
                                }
                            }
                        }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8

                        Button {
                            Layout.fillWidth: true
                            text: qsTr("🎬 Apply to Video Clip")
                            onClicked: {
                                filter.set('argument', textArea.text);
                                statusIsError = false;
                                statusMessage = "Updated video text overlay!";
                            }
                        }

                        Button {
                            text: qsTr("📋 Copy")
                            onClicked: {
                                textArea.selectAll();
                                textArea.copy();
                                statusIsError = false;
                                statusMessage = "Copied to clipboard!";
                            }
                        }
                    }
                }
            }

            // ==========================================
            // TAB 1: DALL-E 3 B-ROLL GENERATOR
            // ==========================================
            ScrollView {
                clip: true
                ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

                ColumnLayout {
                    width: parent.width
                    spacing: 8

                    Label {
                        text: qsTr("Generate AI B-Roll & Visuals (DALL-E 3):")
                        font.bold: true
                    }

                    TextField {
                        id: imgPromptInput
                        Layout.fillWidth: true
                        placeholderText: qsTr("e.g. Cinematic wide shot of futuristic Tokyo in rain, neon reflections")
                        selectByMouse: true
                    }

                    GridLayout {
                        columns: 2
                        Layout.fillWidth: true
                        rowSpacing: 4
                        columnSpacing: 6

                        Label {
                            text: qsTr("Style:")
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: imgStyleCombo
                            Layout.fillWidth: true
                            textRole: "text"
                            valueRole: "value"
                            model: ListModel {
                                ListElement { text: "Cinematic Film (35mm Anamorphic)"; value: "cinematic film still, 35mm photograph, dramatic cinematic lighting, photorealistic, 8k" }
                                ListElement { text: "Photorealistic Photography"; value: "ultra-realistic photographic portrait, highly detailed, natural lighting" }
                                ListElement { text: "Cyberpunk Neon"; value: "cyberpunk aesthetic, vibrant neon lighting, dark moody atmosphere" }
                                ListElement { text: "3D Unreal Engine 5 / Render"; value: "octane render, unreal engine 5, 3d digital art, raytraced" }
                                ListElement { text: "Studio Anime"; value: "studio anime style, vibrant colors, clean lineart, aesthetic wallpaper" }
                                ListElement { text: "Minimalist Vector"; value: "flat minimalist vector illustration, clean modern graphics" }
                                ListElement { text: "None / Custom Prompt Only"; value: "none" }
                            }
                        }

                        Label {
                            text: qsTr("Aspect Ratio:")
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: imgSizeCombo
                            Layout.fillWidth: true
                            textRole: "text"
                            valueRole: "value"
                            model: ListModel {
                                ListElement { text: "16:9 Landscape (1792x1024) - HD Video"; value: "1792x1024" }
                                ListElement { text: "1:1 Square (1024x1024) - Social / Instagram"; value: "1024x1024" }
                                ListElement { text: "9:16 Portrait (1024x1792) - Shorts / TikTok"; value: "1024x1792" }
                            }
                        }

                        Label {
                            text: qsTr("Quality:")
                            Layout.alignment: Qt.AlignRight
                        }

                        ComboBox {
                            id: imgQualityCombo
                            Layout.fillWidth: true
                            textRole: "text"
                            valueRole: "value"
                            model: ListModel {
                                ListElement { text: "Standard"; value: "standard" }
                                ListElement { text: "HD (High Detail)"; value: "hd" }
                            }
                        }
                    }

                    Button {
                        Layout.fillWidth: true
                        text: isGeneratingImage ? "Rendering DALL-E 3 Image (takes ~20s)..." : "🎨 Generate B-Roll Image"
                        enabled: !isGeneratingImage
                        highlighted: true
                        onClicked: generateDalleImage()
                    }

                    // Result Preview
                    Rectangle {
                        id: dalleResultBox
                        Layout.fillWidth: true
                        Layout.preferredHeight: 220
                        color: "#0f172a"
                        border.color: "#3b82f6"
                        border.width: 1
                        radius: 6
                        visible: false

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 6
                            spacing: 4

                            Image {
                                id: dallePreview
                                Layout.fillWidth: true
                                Layout.fillHeight: true
                                fillMode: Image.PreserveAspectFit
                            }

                            Label {
                                id: dalleRevisedLabel
                                Layout.fillWidth: true
                                font.pixelSize: 9
                                color: "#94a3b8"
                                elide: Text.ElideRight
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                Button {
                                    Layout.fillWidth: true
                                    text: qsTr("Open in Web Browser / Download")
                                    font.pixelSize: 11
                                    onClicked: {
                                        if (dallePreview.source) {
                                            Qt.openUrlExternally(dallePreview.source);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // TAB 2: STYLE & POSITION (TextFilterUi)
            // ==========================================
            ScrollView {
                clip: true
                ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

                ColumnLayout {
                    width: parent.width
                    spacing: 8

                    RowLayout {
                        Layout.fillWidth: true
                        Label {
                            text: qsTr("Preset:")
                            font.bold: true
                        }

                        Shotcut.Preset {
                            id: preset
                            Layout.fillWidth: true
                            parameters: textFilterUi.parameterList.concat(['argument'])
                            onBeforePresetLoaded: {
                                filter.resetProperty(textFilterUi.rectProperty);
                                filter.set(textFilterUi.pointSizeProperty, 0);
                                resetSimpleKeyframes();
                            }
                            onPresetSelected: {
                                if (filter.get('opacity') === '')
                                    filter.set('opacity', 1.0);
                                setControls();
                                textFilterUi.setKeyframedControls();
                                initializeSimpleKeyframes();
                                filter.blockSignals = true;
                                filter.set(textFilterUi.middleValue, filter.getRect(textFilterUi.rectProperty, filter.animateIn + 1));
                                if (filter.animateIn > 0)
                                    filter.set(textFilterUi.startValue, filter.getRect(textFilterUi.rectProperty, 0));
                                if (filter.animateOut > 0)
                                    filter.set(textFilterUi.endValue, filter.getRect(textFilterUi.rectProperty, filter.duration - 1));
                                filter.blockSignals = false;
                            }
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#374151"
                    }

                    Shotcut.TextFilterUi {
                        id: textFilterUi
                        Layout.fillWidth: true
                    }
                }
            }

            // ==========================================
            // TAB 3: SETTINGS & OPENAI API KEY
            // ==========================================
            ScrollView {
                clip: true
                ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

                ColumnLayout {
                    width: parent.width
                    spacing: 10

                    Label {
                        text: qsTr("OpenAI API Configuration:")
                        font.bold: true
                        font.pixelSize: 13
                    }

                    Label {
                        text: qsTr("Your OpenAI API Key is stored locally and securely on your computer. It enables GPT-4o text generation, Whisper subtitles, and DALL-E 3 image rendering.")
                        wrapMode: Text.WordWrap
                        font.pixelSize: 11
                        color: "#9ca3af"
                        Layout.fillWidth: true
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        TextField {
                            id: apiKeyInput
                            Layout.fillWidth: true
                            echoMode: showKeyCheck.checked ? TextInput.Normal : TextInput.Password
                            placeholderText: "sk-proj-..."
                            selectByMouse: true
                            onTextChanged: {
                                vibeoRoot.userApiKey = text.trim();
                            }
                        }

                        CheckBox {
                            id: showKeyCheck
                            text: qsTr("Show")
                        }
                    }

                    Label {
                        id: keyStatusLabel
                        font.pixelSize: 10
                        color: vibeoRoot.userApiKey ? "#34d399" : "#fbbf24"
                        Layout.fillWidth: true
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8

                        Button {
                            Layout.fillWidth: true
                            text: qsTr("💾 Save Key")
                            onClicked: {
                                var key = apiKeyInput.text.trim();
                                if (key.length > 0) {
                                    VibeoStorage.saveSetting("openai_api_key", key);
                                    vibeoRoot.userApiKey = key;
                                    statusIsError = false;
                                    statusMessage = "API Key saved successfully!";
                                    keyStatusLabel.text = "Key saved permanently.";
                                }
                            }
                        }

                        Button {
                            Layout.fillWidth: true
                            text: qsTr("⚡ Test Connection")
                            onClicked: {
                                var key = apiKeyInput.text.trim();
                                statusMessage = "Testing OpenAI API connection...";
                                statusIsError = false;
                                OpenAiClient.testApiKey(key, function(err, ok, msg) {
                                    if (ok) {
                                        statusIsError = false;
                                        statusMessage = "✓ Connection Successful! " + msg;
                                        keyStatusLabel.text = "Verified and connected to OpenAI API.";
                                    } else {
                                        statusIsError = true;
                                        statusMessage = "✗ Connection Failed: " + (err ? err.message : msg);
                                        keyStatusLabel.text = "Connection test failed.";
                                    }
                                });
                            }
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#374151"
                        Layout.topMargin: 6
                        Layout.bottomMargin: 6
                    }

                    Label {
                        text: qsTr("Need an OpenAI API Key?")
                        font.bold: true
                    }

                    Button {
                        Layout.fillWidth: true
                        text: qsTr("🌐 Open OpenAI API Keys Dashboard")
                        onClicked: {
                            Qt.openUrlExternally("https://platform.openai.com/api-keys");
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#374151"
                        Layout.topMargin: 6
                        Layout.bottomMargin: 6
                    }

                    Label {
                        text: qsTr("vibeoVideo Companion Tools:")
                        font.bold: true
                    }

                    Label {
                        text: qsTr("To run automatic Whisper audio-to-subtitle transcription (.srt) or Text-to-Speech voiceovers, run the companion tool in the plugin folder.")
                        font.pixelSize: 11
                        color: "#9ca3af"
                        wrapMode: Text.WordWrap
                        Layout.fillWidth: true
                    }
                }
            }
        }
    }
}
