import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';

interface FormListProps {
  onSelectForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
}

export const FormList = ({ onSelectForm, onDeleteForm }: FormListProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (err) {
      console.error('Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading forms...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Saved Forms</h2>
      {forms.length === 0 ? (
        <p className="text-gray-500">No saved forms found</p>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => (
            <div 
              key={form.id} 
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
            >
              <div>
                <div className="font-medium">
                  Form {form.id.slice(0, 8)}...
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(form.created_at).toLocaleDateString()} - {form.status}
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => onSelectForm(form.id)}
                  className="px-3 py-1 bg-yellow-400 text-gray-900 rounded hover:bg-yellow-500"
                >
                  Open
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this form?')) {
                      onDeleteForm(form.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 