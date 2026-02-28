import axios from 'axios';

const categoryKeywords = {
  plumber: ['plumber', 'pipe', 'leak', 'tap', 'faucet', 'drain', 'water', 'geyser', 'bathroom', 'toilet', 'sink', 'नल', 'पाइप', 'पानी', 'गीजर'],
  electrician: ['electrician', 'electric', 'wiring', 'light', 'fan', 'switch', 'socket', 'power', 'electricity', 'बिजली', 'लाइट', 'पंखा', 'स्विच'],
  carpenter: ['carpenter', 'wood', 'furniture', 'door', 'window', 'cabinet', 'table', 'chair', 'बढ़ई', 'लकड़ी', 'फर्नीचर', 'दरवाजा'],
  painter: ['painter', 'paint', 'wall', 'color', 'painting', 'पेंटर', 'रंग', 'दीवार', 'पेंटिंग'],
  cleaner: ['cleaner', 'cleaning', 'clean', 'maid', 'sweep', 'mop', 'dust', 'सफाई', 'झाड़ू', 'पोछा'],
  mechanic: ['mechanic', 'car', 'bike', 'vehicle', 'repair', 'मैकेनिक', 'गाड़ी', 'मरम्मत'],
  ac_technician: ['ac', 'air conditioner', 'cooling', 'hvac', 'एसी', 'एयर कंडीशनर'],
  pest_control: ['pest', 'insects', 'rats', 'cockroach', 'termite', 'कीट', 'चूहा', 'कॉकरोच']
};

export const extractCategory = async (description) => {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  try {
    const response = await axios.post(
      process.env.SARVAM_API_URL,
      {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: 'You are a service categorization assistant. Extract the service type from user requests. Respond with only one word from: plumber, electrician, carpenter, painter, cleaner, mechanic, ac_technician, pest_control, or general.'
          },
          {
            role: 'user',
            content: description
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const category = response.data.choices[0].message.content.trim().toLowerCase();
    return categoryKeywords[category] ? category : 'general';
  } catch (error) {
    console.error('Category extraction error:', error.message);
    return 'general';
  }
};
