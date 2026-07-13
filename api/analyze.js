// api/analyze.js
export default async function handler(req, res) {
    // 1. 確認請求方法是否正確
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只接受 POST 請求' });
    }

    // 2. 從前端接收照片編碼與讀取 Vercel 裡的金鑰
    const { imageBase64 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: '伺服器未設定 API 金鑰' });
    }

    if (!imageBase64) {
        return res.status(400).json({ error: '未收到圖片資料' });
    }

    try {
        // 3. 呼叫 Google Gemini 1.5 Flash API 進行視覺辨識
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "這是一張食物的照片，請分析有哪些食物，並估算大約的總卡路里。請用簡短的繁體中文回答，格式如下：\n- 食物：...\n- 總熱量：... kcal" },
                        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        // 4. 擷取 AI 的回答並回傳給前端
        if (data.candidates && data.candidates.length > 0) {
            const aiText = data.candidates[0].content.parts[0].text;
            res.status(200).json({ result: aiText });
        } else {
            console.error("Gemini API 回應異常:", data);
            res.status(500).json({ error: 'AI 無法辨識此圖片，請換一張試試' });
        }
        
    } catch (error) {
        // 若發生網路或伺服器錯誤，紀錄在 Vercel Logs 並回傳錯誤訊息
        console.error("API 呼叫發生錯誤:", error);
        res.status(500).json({ error: 'AI 分析伺服器發生錯誤，請稍後再試' });
    }
}
