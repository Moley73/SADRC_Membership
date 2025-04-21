import { AwardsService } from '../../../lib/awardsService';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all award categories (publicly readable)
      const categories = await AwardsService.getCategories();
      return res.status(200).json(categories);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in categories API:', error);
    return res.status(500).json({ error: error.message });
  }
}
