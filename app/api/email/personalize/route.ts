import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, company, position, personalizedMessage, template } = await request.json();

    const aiProvider = process.env.AI_PROVIDER || 'groq';
    const apiKey = aiProvider === 'groq' ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: `${aiProvider.toUpperCase()} API 키가 설정되지 않았습니다.` },
        { status: 500 }
      );
    }

    const prompt = template 
      ? `다음 템플릿을 바탕으로 개인화된 이메일을 작성해주세요:

템플릿:
${template}

수신자 정보:
- 이름: ${name}
- 회사: ${company}
- 직책: ${position}
- 개인화 메시지: ${personalizedMessage}

{name}, {company}, {position}, {personalized_message} 변수를 실제 값으로 대체하고, 자연스럽게 개인화된 이메일을 작성해주세요. HTML 형식으로 작성하되, <html>, <body> 태그는 제외하고 본문만 작성해주세요.`
      : `다음 정보를 바탕으로 전문적이면서도 친근한 비즈니스 이메일을 작성해주세요:

수신자 정보:
- 이름: ${name}
- 회사: ${company}
- 직책: ${position}
- 개인화 메시지: ${personalizedMessage}

요구사항:
1. 한국어 또는 영어로 자연스럽게 작성 (수신자 정보에 맞게)
2. 개인화 메시지를 자연스럽게 녹여내기
3. 전문적이면서도 친근한 톤
4. HTML 형식으로 작성 (<html>, <body> 태그 제외)

이메일 본문만 작성해주세요.`;

    let personalizedEmail = '';

    if (aiProvider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'system',
              content: '당신은 전문적인 비즈니스 이메일 작성자입니다. 자연스럽고 개인화된 이메일을 작성합니다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API 오류: ${response.status}`);
      }

      const data = await response.json();
      personalizedEmail = data.choices[0].message.content;
    } else {
      // Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API 오류: ${response.status}`);
      }

      const data = await response.json();
      personalizedEmail = data.candidates[0].content.parts[0].text;
    }

    return NextResponse.json({
      success: true,
      personalizedEmail,
    });
  } catch (error: any) {
    console.error('Personalize error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
