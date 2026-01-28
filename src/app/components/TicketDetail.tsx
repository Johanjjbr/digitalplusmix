import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ticketsAPI, ticketCommentsAPI } from '@/lib/api-tickets-zones';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';

interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  reportedBy: string;
  resolvedAt: string;
  scheduledVisitDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketResponse, commentsResponse] = await Promise.all([
        ticketsAPI.getOne(id!),
        ticketCommentsAPI.getByTicket(id!),
      ]);
      setTicket(ticketResponse.ticket);
      setComments(commentsResponse.comments || []);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketsAPI.update(id!, { status: newStatus });
      toast.success('Estado actualizado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await ticketsAPI.update(id!, { priority: newPriority });
      toast.success('Prioridad actualizada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Error al actualizar la prioridad');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setSubmittingComment(true);
      await ticketCommentsAPI.create({
        ticketId: id!,
        comment: newComment,
        isInternal: false,
      });
      setNewComment('');
      toast.success('Comentario agregado');
      loadData();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-500',
      billing: 'bg-green-500',
      complaint: 'bg-red-500',
      installation: 'bg-purple-500',
      other: 'bg-gray-500',
    };
    const labels: Record<string, string> = {
      technical: 'Técnico',
      billing: 'Facturación',
      complaint: 'Reclamo',
      installation: 'Instalación',
      other: 'Otro',
    };
    return <Badge className={colors[category]}>{labels[category]}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    const labels: Record<string, string> = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
      cancelled: 'Cancelado',
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-400',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-600',
    };
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return <Badge className={colors[priority]}>{labels[priority]}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Ticket no encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/tickets')}>
            Volver a Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/tickets')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Tickets
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">{ticket.title}</h1>
              {getCategoryBadge(ticket.category)}
            </div>
            <p className="text-gray-600">
              Ticket #{ticket.id.slice(0, 8)} • Creado el{' '}
              {new Date(ticket.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Comentarios ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay comentarios aún
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{comment.userName}</span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Interno
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))
                )}

                <Separator />

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment}>
                  <Label htmlFor="comment">Agregar Comentario</Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                    className="mt-2"
                  />
                  <Button
                    type="submit"
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    disabled={submittingComment}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submittingComment ? 'Enviando...' : 'Enviar Comentario'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Estado y Prioridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Estado Actual</Label>
                <div className="mt-2">{getStatusBadge(ticket.status)}</div>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridad</Label>
                <div className="mt-2">{getPriorityBadge(ticket.priority)}</div>
                <Select
                  value={ticket.priority}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{ticket.clientName || 'N/A'}</p>
                </div>
                {ticket.clientId && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => navigate(`/clients/${ticket.clientId}`)}
                  >
                    Ver Perfil del Cliente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Creado</p>
                  <p className="text-sm text-gray-600">
                    {new Date(ticket.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {ticket.scheduledVisitDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Visita Programada</p>
                    <p className="text-sm text-gray-600">
                      {new Date(ticket.scheduledVisitDate).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              )}

              {ticket.resolvedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Resuelto</p>
                    <p className="text-sm text-gray-600">
                      {new Date(ticket.resolvedAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {ticket.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}