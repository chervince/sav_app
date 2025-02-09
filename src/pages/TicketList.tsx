import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SAVTicket, SAVNote } from '../lib/types';
import { ClipboardList, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function TicketList() {
  const [tickets, setTickets] = useState<SAVTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SAVTicket | null>(null);
  const [notes, setNotes] = useState<SAVNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
    getUserRole();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadNotes(selectedTicket.id);
    }
  }, [selectedTicket]);

  async function getUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
    }
  }

  async function loadTickets() {
    try {
      const { data, error } = await supabase
        .from('sav_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes(ticketId: string) {
    const { data, error } = await supabase
      .from('sav_notes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erreur lors du chargement des notes');
      return;
    }

    setNotes(data);
  }

  async function updateTicketStatus(ticketId: string, status: SAVTicket['status']) {
    if (userRole !== 'parent') {
      toast.error('Vous n\'avez pas les droits pour modifier le statut');
      return;
    }

    try {
      const { error } = await supabase
        .from('sav_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status } : ticket
      ));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  }

  async function addNote() {
    if (!selectedTicket || !newNote.trim()) return;

    if (userRole !== 'parent') {
      toast.error('Vous n\'avez pas les droits pour ajouter des notes');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('sav_notes')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          content: newNote
        });

      if (error) throw error;

      setNewNote('');
      loadNotes(selectedTicket.id);
      toast.success('Note ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la note');
    }
  }

  async function deleteTicket(ticketId: string) {
    if (userRole !== 'parent') {
      toast.error('Vous n\'avez pas les droits pour supprimer les tickets');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return;

    try {
      const { error } = await supabase
        .from('sav_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.filter(t => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      toast.success('Ticket supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Liste des tickets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tickets SAV
            </h2>
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{ticket.customer_name}</h3>
                      <p className="text-sm text-gray-600">{ticket.product_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ticket.status === 'pending' ? 'En attente' :
                         ticket.status === 'in_progress' ? 'En cours' :
                         ticket.status === 'resolved' ? 'Résolu' :
                         'Annulé'}
                      </span>
                      {userRole === 'parent' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTicket(ticket.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Détails du ticket et notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTicket ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Détails du ticket</h2>
                <div className="space-y-4 mb-6">
                  {userRole === 'parent' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as SAVTicket['status'])}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="pending">En attente</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Résolu</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className={`mt-1 px-3 py-2 rounded-md ${
                        selectedTicket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedTicket.status === 'pending' ? 'En attente' :
                         selectedTicket.status === 'in_progress' ? 'En cours' :
                         selectedTicket.status === 'resolved' ? 'Résolu' :
                         'Annulé'}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">Client</h3>
                    <p>{selectedTicket.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Contact</h3>
                    <p>{selectedTicket.email}</p>
                    <p>{selectedTicket.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Produit</h3>
                    <p>{selectedTicket.product_type} - {selectedTicket.serial_number}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Notes
                  </h3>
                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                    {notes.map(note => (
                      <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                        <p className="mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                  {userRole === 'parent' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Ajouter une note..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        onClick={addNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Sélectionnez un ticket pour voir les détails
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}