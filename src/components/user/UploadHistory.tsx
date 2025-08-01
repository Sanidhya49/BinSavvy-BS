
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Eye, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface AnalysisResults {
  message?: string;
  total_detections?: number;
  model_used?: string;
  average_confidence?: number;
  waste_types?: Record<string, number>;
  detections?: Array<{
    class: string;
    confidence: number;
    bbox?: number[];
  }>;
}

interface ImageUpload {
  image_id: string;
  image_url: string;
  location: string;
  latitude?: number;
  longitude?: number;
  uploaded_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_image_url?: string;
  analysis_results?: AnalysisResults;
  error_message?: string;
}

export default function UploadHistory() {
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageUpload | null>(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserImages();
      if (response.data) {
        setUploads(response.data);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const getStatusBadge = (status: string, analysisResults?: AnalysisResults) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, text: 'Pending', icon: Clock },
      processing: { variant: 'default' as const, text: 'Processing', icon: Clock },
      completed: { variant: 'default' as const, text: 'Completed', icon: CheckCircle },
      failed: { variant: 'destructive' as const, text: 'Failed', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    // Check if completed but has ML processing error
    if (status === 'completed' && analysisResults?.message?.includes('ML processing failed')) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          ML Failed
        </Badge>
      );
    }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EImage not available%3C/text%3E%3C/svg%3E";
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading upload history...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload History</h1>
          <p className="text-gray-600">View and manage your waste image contributions</p>
        </div>
        <Button onClick={fetchUploads} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Uploads Grid */}
      {uploads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
            <p className="text-gray-600">
              Start by uploading your first waste image from the Upload page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uploads.map((upload) => (
            <Card key={upload.image_id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={upload.image_url}
                  alt={`Waste image from ${upload.location}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(upload.status, upload.analysis_results)}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium truncate">
                  {upload.location}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(upload.uploaded_at)}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {upload.latitude && upload.longitude 
                        ? `GPS: ${upload.latitude.toFixed(4)}, ${upload.longitude.toFixed(4)}`
                        : 'No GPS data'
                      }
                    </span>
                  </div>
                  
                  {upload.analysis_results && upload.analysis_results.total_detections && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        {upload.analysis_results.total_detections} items detected
                      </span>
                    </div>
                  )}
                  
                  {upload.analysis_results?.message && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-yellow-600">
                        {upload.analysis_results.message}
                      </span>
                    </div>
                  )}
                  
                  {upload.error_message && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-600">
                        {upload.error_message}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImage(upload)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Details Dialog */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Image Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-video">
                  <img
                    src={selectedImage.image_url}
                    alt={`Waste image from ${selectedImage.location}`}
                    className="w-full h-full object-cover rounded"
                    onError={handleImageError}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Location Information</h4>
                    <p className="text-sm text-gray-600">{selectedImage.location}</p>
                    {selectedImage.latitude && selectedImage.longitude && (
                      <p className="text-sm text-gray-600 mt-1">
                        GPS: {selectedImage.latitude}, {selectedImage.longitude}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Upload Status</h4>
                    {getStatusBadge(selectedImage.status, selectedImage.analysis_results)}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(selectedImage.uploaded_at)}
                    </p>
                  </div>
                </div>

                {selectedImage.analysis_results && Object.keys(selectedImage.analysis_results).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Analysis Results</h4>
                    <div className="bg-gray-100 p-4 rounded">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Total Detections</p>
                          <p className="text-lg font-bold text-green-600">
                            {selectedImage.analysis_results.total_detections || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Model Used</p>
                          <p className="text-sm text-gray-600">
                            {selectedImage.analysis_results.model_used || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedImage.analysis_results.message && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Message</p>
                          <p className="text-sm text-gray-600">
                            {selectedImage.analysis_results.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedImage.error_message && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Error Information</h4>
                    <div className="bg-red-50 p-4 rounded border border-red-200">
                      <p className="text-sm text-red-800">{selectedImage.error_message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
