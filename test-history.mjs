import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function test() {
  const history = [
    { role: 'user', parts: [{text: 'My name is Bob'}] },
    { role: 'model', parts: [{text: 'Hello Bob'}] }
  ];
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history
  });
  const response = await chat.sendMessage({ message: 'What is my name?' });
  console.log("RESPONSE:", response.text);
}
test().catch(console.error);
