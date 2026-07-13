// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: '只接受 POST 請求' });
    
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) return res.status(500).json({ error: '伺服器未設定 API 金鑰' });

    const { type, imageBase64, textContent, logsSummary } = req.body;

    try {
        let bodyData = {};

        // 根據不同的功能類型，組裝不同的 AI 提示詞
        if (type === 'image') {
            bodyData = {
                contents: [{
                    parts: [
                        { text: "這是一張食物的照片，請分析有哪些食物，並估算大約的總卡路里。請用簡短的繁體中文回答，格式如下：\n- 食物：...\n- 總熱量：... kcal" },
                        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                    ]
                }]
            };
        } else if (type === 'text_food') {
            bodyData = {
                contents: [{
                    parts: [{ text: `請分析以下食物描述有哪些食物，並估算大約的總卡路里。請用簡短的繁體中文回答，格式如下：\n- 食物：...\n- 總熱量：... kcal\n\n食物描述：${textContent}` }]
                }]
            };
        } else if (type === 'exercise') {
            bodyData = {
                contents: [{
                    parts: [{ text: `請估算以下運動描述大約消耗的卡路里。請嚴格只回傳一個純數字（整數），絕對不要包含任何單位（如kcal）、標點符號或任何其他文字說明。\n\n運動描述：${textContent}` }]
                }]
            };
        } else if (type === 'advice') {
            bodyData = {
                contents: [{
                    parts: [{ text: `你是一位專業的減脂營養師。根據使用者今天的紀錄摘要，請給予一句溫暖、幽默且實用的減脂鼓勵或具體建議（100字以內，繁體中文）。\n今日紀錄摘要：${logsSummary}` }]
                }]
            };
        } else {
            return res.status(400).json({ error: '未知的請求類型' });
        }

        // 使用運作最穩定的 3.1 輕量版模型
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const aiText = data.candidates[0].content.parts[0].text.trim();
            res.status(200).json({ result: aiText });
        } else {
            res.status(500).json({ error: 'AI 無法處理此請求' });
        }
    } catch (error) {
        res.status(500).json({ error: '伺服器發生錯誤' });
    }
}
