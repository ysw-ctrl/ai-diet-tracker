// api/list.js
export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: '找不到金鑰' });

    try {
        // 呼叫 Google 官方的 ListModels 服務
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        // 直接把 Google 回傳的清單顯示在網頁畫面上
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
