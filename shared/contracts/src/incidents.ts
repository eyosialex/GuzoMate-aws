export interface IncidentReportDto {
  id: string;
  type: string;
  description?: string;
  lat: number;
  lon: number;
  severity?: 'low' | 'medium' | 'high';
  status: 'reported' | 'confirmed' | 'resolved';
}
