module.exports = async (req, res) => {
  // CORS 설정 (필요시)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { planetName } = req.body;

  if (!planetName) {
    return res.status(400).json({ error: '천체 이름(planetName)이 필요합니다.' });
  }

  // Vercel 환경 변수에서 API 키 가져오기 (절대 코드에 하드코딩 금지)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${planetName}에 대해 아래 형식으로 정확하게 알려줘. 고등학교 지구과학/물리 수준으로 설명해줘.\n\n**기본 정보**\n- 분류: (행성/왜소행성/위성 등)\n- 지름:\n- 질량: (지구=1 기준)\n- 태양까지 거리:\n- 공전 주기:\n- 자전 주기:\n- 평균 온도:\n- 위성 수:\n\n**특징**\n(3~4줄로 이 천체의 가장 독특한 특징 설명)\n\n**탐사 역사**\n(실제 탐사선 이름과 발견 사실 2~3가지)\n\n**관련 신화**\n(이름의 어원이 된 신화 설명)\n\n**지구과학/물리 연계**\n(고등학교 교과서와 연결되는 개념 1~2가지)`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error ? errorData.error.message : response.statusText;
      return res.status(response.status).json({ error: `API 오류: ${errMsg}` });
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: 'AI가 응답을 생성하지 못했습니다.' });
    }
    
    // 성공 시 데이터 반환
    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });

  } catch (error) {
    console.error("Gemini API 호출 중 서버 에러:", error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};
