import { Request, Response } from 'express';
import { pool } from '../../config/database.js';

export class SavedPlacesController {
  /**
   * GET /api/v1/saved-places
   * List saved places for the authenticated user
   */
  public static async listSavedPlaces(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const query = `
        SELECT 
          sp.id as saved_id,
          sp.place_id,
          sp.created_at,
          COALESCE(p.name, ag.content) as name,
          COALESCE(p.category, ag.other_tags) as category,
          COALESCE(p.address, '') as address,
          COALESCE(p.latitude, ag.latitude) as latitude,
          COALESCE(p.longitude, ag.longtiude) as longitude
        FROM saved_places sp
        LEFT JOIN places p ON p.id::text = sp.place_id
        LEFT JOIN addis_geo_points ag ON ag.id::text = sp.place_id
        WHERE sp.user_id = $1
        ORDER BY sp.created_at DESC;
      `;

      const result = await pool.query(query, [userId]);

      const items = result.rows.map((row) => ({
        id: row.place_id,
        savedId: row.saved_id,
        name: row.name || 'Saved Place',
        category: row.category || 'point_of_interest',
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        createdAt: row.created_at,
      }));

      return res.status(200).json({
        items,
        total: items.length
      });
    } catch (error: any) {
      console.error('[SavedPlacesController.listSavedPlaces]', error);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/saved-places
   * Save a place for the authenticated user
   */
  public static async savePlace(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { placeId } = req.body;
      if (!placeId) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'placeId is required' }
        });
      }

      const insertQuery = `
        INSERT INTO saved_places (user_id, place_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, place_id) DO NOTHING
        RETURNING id, user_id, place_id, created_at;
      `;

      const result = await pool.query(insertQuery, [userId, String(placeId)]);

      return res.status(201).json({
        placeId: String(placeId),
        saved: true,
        createdAt: result.rows[0]?.created_at || new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[SavedPlacesController.savePlace]', error);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }

  /**
   * DELETE /api/v1/saved-places/:placeId
   * Remove a saved place for the authenticated user
   */
  public static async deleteSavedPlace(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { placeId } = req.params;
      if (!placeId) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'placeId is required' }
        });
      }

      const deleteQuery = `
        DELETE FROM saved_places
        WHERE user_id = $1 AND place_id = $2;
      `;

      await pool.query(deleteQuery, [userId, String(placeId)]);

      return res.status(204).send();
    } catch (error: any) {
      console.error('[SavedPlacesController.deleteSavedPlace]', error);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: error.message }
      });
    }
  }
}
