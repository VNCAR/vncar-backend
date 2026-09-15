import { Router, Request, Response } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { GoogleGenerativeAI, Schema, Type } from '@google/generative-ai';
import { env } from '../config/env';

const router = Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '');

router.post('/parse-intent', verifyFirebaseToken, async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pickup: {
              type: Type.STRING,
              description: 'Địa điểm đón khách (ví dụ: Sân bay Nội Bài, Hà Đông). Trả về null nếu không rõ.'
            },
            dropoff: {
              type: Type.STRING,
              description: 'Địa điểm đến (ví dụ: Quận Cầu Giấy, Bến xe Mỹ Đình). Trả về null nếu không rõ.'
            },
            time: {
              type: Type.STRING,
              description: 'Thời gian đón khách được đề cập (ví dụ: 17:00 hôm nay, 5h chiều). Trả về null nếu không rõ.'
            },
            price: {
              type: Type.NUMBER,
              description: 'Mức giá mong muốn tính bằng VNĐ (ví dụ: 200k -> 200000). Trả về null nếu không rõ.'
            },
            carType: {
              type: Type.STRING,
              description: 'Loại xe mong muốn (ví dụ: 4 chỗ, 7 chỗ). Trả về null nếu không rõ.'
            },
            distance_km: {
              type: Type.NUMBER,
              description: 'Dự đoán khoảng cách tuyến đường bằng Kilomet (ví dụ: 5.5). Dựa vào hiểu biết thực tế về bản đồ Việt Nam.'
            },
            duration_mins: {
              type: Type.NUMBER,
              description: 'Dự đoán thời gian di chuyển bằng phút (ví dụ: 15). Dựa vào hiểu biết thực tế.'
            },
            originLat: {
              type: Type.NUMBER,
              description: 'Dự đoán Vĩ độ (Latitude) của điểm đón. (Ví dụ: 21.0285 cho Hà Nội, 10.8231 cho TPHCM)'
            },
            originLng: {
              type: Type.NUMBER,
              description: 'Dự đoán Kinh độ (Longitude) của điểm đón. (Ví dụ: 105.8542 cho Hà Nội, 106.6297 cho TPHCM)'
            },
            destLat: {
              type: Type.NUMBER,
              description: 'Dự đoán Vĩ độ (Latitude) của điểm đến.'
            },
            destLng: {
              type: Type.NUMBER,
              description: 'Dự đoán Kinh độ (Longitude) của điểm đến.'
            }
          },
          required: ['pickup', 'dropoff', 'time', 'price', 'carType', 'distance_km', 'duration_mins', 'originLat', 'originLng', 'destLat', 'destLng']
        }
      }
    });

    const systemInstruction = "Bạn là trợ lý ảo cho ứng dụng gọi xe VNCAR. Nhiệm vụ của bạn là trích xuất thông tin chuyến đi từ câu nói của người dùng. Đặc biệt, hãy dùng kiến thức địa lý Việt Nam để dự đoán khoảng cách (distance_km), thời gian di chuyển (duration_mins) và toạ độ GPS (originLat, originLng, destLat, destLng) tương đối chính xác nhất có thể.";
    const fullPrompt = `${systemInstruction}\n\nYêu cầu của người dùng: "${prompt}"`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    
    // Validate JSON
    const parsedData = JSON.parse(text);

    res.status(200).json({
      message: 'Parsed successfully',
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error parsing intent with Gemini:', error);
    res.status(500).json({ error: 'Failed to parse intent', details: error.message });
  }
});

export default router;
