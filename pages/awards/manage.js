import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Tabs, Tab, Button, Alert, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AuthGuard from '../../components/AuthGuard';
import { supabase } from '../../lib/supabaseClient';

function AwardsManagePage() {
  const [tab, setTab] = useState(0);
  const router = useRouter();

  // Placeholder for future data fetching and admin checks
  // You can add useEffect hooks here for fetching settings, categories, nominations, etc.

  return (
    <>
      <Head>
        <title>SADRC Awards Management</title>
        <meta name="description" content="Manage SADRC club awards" />
      </Head>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Awards Management
        </Typography>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Phase & Settings" />
            <Tab label="Categories" />
            <Tab label="Nominations" />
            <Tab label="Results" />
          </Tabs>
          <Divider sx={{ my: 2 }} />
          {tab === 0 && (
            <Box>
              <Typography variant="h6">Phase & Settings</Typography>
              <PhaseSettingsManager />
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="h6">Award Categories</Typography>
              <CategoriesManager />
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography variant="h6">Nominations Review</Typography>
              <NominationsManager />
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="h6">Voting Results & Reporting</Typography>
              {/* TODO: Add results/statistics UI */}
              <Alert severity="info" sx={{ mt: 2 }}>Results reporting coming soon.</Alert>
            </Box>
          )}
        </Paper>
        <Button variant="outlined" color="primary" onClick={() => router.push('/awards')}>Back to Awards</Button>
      </Container>
    </>
  );
}

function PhaseSettingsManager() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [edited, setEdited] = useState({});

  // Fetch existing settings to understand available fields
  useEffect(() => {
    setLoading(true);
    fetch('/api/awards/public-settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        console.log("Current settings:", data); // Log to see available fields
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  const handleChange = (field, value) => {
    setEdited(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Only include fields that exist in the original settings object
      const validFields = {};
      Object.keys(edited).forEach(key => {
        // Only include fields that exist in the original settings
        if (key in settings) {
          // Format date fields
          if (typeof edited[key] === 'string' && edited[key].includes('-') && !key.includes('phase')) {
            validFields[key] = new Date(edited[key]).toISOString();
          } 
          // Convert year to integer if needed
          else if (key === 'active_year') {
            validFields[key] = parseInt(edited[key], 10);
          }
          // Otherwise use the value as is
          else {
            validFields[key] = edited[key];
          }
        }
      });

      // Basic update with just the modified fields + id
      const updateData = {
        id: settings.id,
        ...validFields,
        updated_at: new Date().toISOString()
      };

      console.log("Sending update with data:", updateData);

      const res = await fetch('/api/awards/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const updated = await res.json();
      setSettings(updated);
      setEdited({});
      setSuccess('Settings updated successfully.');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 2 }} />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  if (!settings) return null;

  // Dynamic fields based on what's available in the settings object
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Current Phase:</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ minWidth: 200 }}>
            <select
              value={edited.current_phase || settings.current_phase}
              onChange={e => handleChange('current_phase', e.target.value)}
            >
              <option value="inactive">Inactive</option>
              <option value="nomination">Nomination</option>
              <option value="voting">Voting</option>
              <option value="completed">Completed</option>
            </select>
          </Box>
        </Box>
        
        <Typography>Active Year:</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ maxWidth: 200 }}>
            <input
              type="number"
              value={edited.active_year || settings.active_year || ''}
              onChange={e => handleChange('active_year', e.target.value)}
            />
          </Box>
        </Box>

        {/* Only show UI for fields that actually exist in the settings */}
        {settings.nomination_start_date !== undefined && (
          <>
            <Typography>Nomination Start Date:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ maxWidth: 250 }}>
                <input
                  type="date"
                  value={edited.nomination_start_date || settings.nomination_start_date ? (edited.nomination_start_date || settings.nomination_start_date).slice(0,10) : ''}
                  onChange={e => handleChange('nomination_start_date', e.target.value)}
                />
              </Box>
            </Box>
          </>
        )}
        
        {settings.nomination_end_date !== undefined && (
          <>
            <Typography>Nomination End Date:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ maxWidth: 250 }}>
                <input
                  type="date"
                  value={edited.nomination_end_date || settings.nomination_end_date ? (edited.nomination_end_date || settings.nomination_end_date).slice(0,10) : ''}
                  onChange={e => handleChange('nomination_end_date', e.target.value)}
                />
              </Box>
            </Box>
          </>
        )}
        
        {settings.voting_start_date !== undefined && (
          <>
            <Typography>Voting Start Date:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ maxWidth: 250 }}>
                <input
                  type="date"
                  value={edited.voting_start_date || settings.voting_start_date ? (edited.voting_start_date || settings.voting_start_date).slice(0,10) : ''}
                  onChange={e => handleChange('voting_start_date', e.target.value)}
                />
              </Box>
            </Box>
          </>
        )}
        
        {settings.voting_end_date !== undefined && (
          <>
            <Typography>Voting End Date:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ maxWidth: 250 }}>
                <input
                  type="date"
                  value={edited.voting_end_date || settings.voting_end_date ? (edited.voting_end_date || settings.voting_end_date).slice(0,10) : ''}
                  onChange={e => handleChange('voting_end_date', e.target.value)}
                />
              </Box>
            </Box>
          </>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving || Object.keys(edited).length === 0}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </Box>
  );
}

function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = useEffect(() => {
    setLoading(true);
    fetch('/api/awards/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load categories');
        setLoading(false);
      });
  }, []);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditCategory(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCategory = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const url = '/api/awards/categories/manage';
      const method = editCategory ? 'PUT' : 'POST';
      const body = editCategory 
        ? { ...formData, id: editCategory.id }
        : formData;
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
      
      const savedCategory = await res.json();
      
      if (editCategory) {
        setCategories(prev => prev.map(cat => cat.id === savedCategory.id ? savedCategory : cat));
        setSuccess('Category updated successfully');
      } else {
        setCategories(prev => [...prev, savedCategory]);
        setSuccess('Category created successfully');
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'An error occurred');
    }
  };

  const handleOpenDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/awards/categories/manage?id=${categoryToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      setSuccess('Category deleted successfully');
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'An error occurred');
      handleCloseDeleteConfirm();
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 2 }} />;

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => handleOpenDialog()}
        sx={{ mb: 3 }}
      >
        Add New Category
      </Button>
      
      {categories.length === 0 ? (
        <Alert severity="info">No award categories found. Create your first category to get started.</Alert>
      ) : (
        <Box>
          {categories.map(category => (
            <Paper key={category.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{category.name}</Typography>
                {category.description && (
                  <Typography variant="body2" color="textSecondary">{category.description}</Typography>
                )}
              </Box>
              <Box>
                <Button 
                  onClick={() => handleOpenDialog(category)} 
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button 
                  onClick={() => handleOpenDeleteConfirm(category)} 
                  color="error"
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      
      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Category Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All nominations and votes for this category will also be deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDeleteCategory} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function NominationsManager() {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    nomination: null
  });
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    reason: ''
  });

  const fetchNominations = useCallback(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/awards/nominations-review?status=${filter}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch nominations');
        return res.json();
      })
      .then(data => {
        setNominations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching nominations:', err);
        setError(err.message || 'Failed to load nominations');
        setLoading(false);
      });
  }, [filter]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleOpenReviewDialog = (nomination) => {
    setReviewDialog({
      open: true,
      nomination
    });
    setReviewData({
      status: 'approved',
      reason: ''
    });
  };

  const handleCloseReviewDialog = () => {
    setReviewDialog({
      open: false,
      nomination: null
    });
  };

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitReview = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/awards/nominations-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominationId: reviewDialog.nomination.id,
          status: reviewData.status,
          reason: reviewData.reason
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update nomination');
      }
      
      setSuccess(`Nomination ${reviewData.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      handleCloseReviewDialog();
      fetchNominations();
    } catch (err) {
      console.error('Error updating nomination:', err);
      setError(err.message || 'Failed to update nomination');
    }
  };

  if (loading && nominations.length === 0) return <CircularProgress sx={{ mt: 2 }} />;

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ mr: 2 }}>Filter:</Typography>
        <select 
          value={filter} 
          onChange={handleFilterChange}
          style={{ 
            padding: '8px', 
            borderRadius: '4px', 
            border: '1px solid #ccc'
          }}
        >
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={fetchNominations}
          sx={{ ml: 2 }}
        >
          Refresh
        </Button>
      </Box>
      
      {nominations.length === 0 ? (
        <Alert severity="info">No {filter} nominations found.</Alert>
      ) : (
        <Box>
          {nominations.map(nomination => (
            <Paper key={nomination.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">
                    Category: {nomination.category?.name || 'Unknown Category'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Nominee:</strong> {nomination.nominee_email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nominated by:</strong> {nomination.nominator_email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date(nomination.created_at).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{nomination.reason}"
                    </Typography>
                  </Box>
                  
                  {nomination.admin_note && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Admin Note:</strong> {nomination.admin_note}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box>
                  {filter === 'pending' ? (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleOpenReviewDialog(nomination)}
                    >
                      Review
                    </Button>
                  ) : (
                    <Chip 
                      label={nomination.status} 
                      color={nomination.status === 'approved' ? 'success' : 'error'} 
                    />
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      
      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Nomination</DialogTitle>
        <DialogContent>
          {reviewDialog.nomination && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1">
                Category: {reviewDialog.nomination.category?.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Nominee: {reviewDialog.nomination.nominee_email}
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{reviewDialog.nomination.reason}"
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Decision:</Typography>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Button
                  variant={reviewData.status === 'approved' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setReviewData(prev => ({ ...prev, status: 'approved' }))}
                  sx={{ mr: 2 }}
                >
                  Approve
                </Button>
                <Button
                  variant={reviewData.status === 'rejected' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setReviewData(prev => ({ ...prev, status: 'rejected' }))}
                >
                  Reject
                </Button>
              </Box>
              
              {reviewData.status === 'rejected' && (
                <TextField
                  name="reason"
                  label="Reason for Rejection"
                  fullWidth
                  multiline
                  rows={3}
                  value={reviewData.reason}
                  onChange={handleReviewInputChange}
                  required
                  helperText="Required when rejecting a nomination"
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained" 
            color="primary"
            disabled={reviewData.status === 'rejected' && (!reviewData.reason || reviewData.reason.trim().length < 5)}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AwardsManage() {
  return (
    <AuthGuard requiredRole="super_admin">
      <AwardsManagePage />
    </AuthGuard>
  );
}
