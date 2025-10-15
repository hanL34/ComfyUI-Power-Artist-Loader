import React, { useState, useEffect, useRef } from 'react';

interface Artist {
  name: string;
  keywords: string;
  image: string;
}

interface ArtistManagerProps {
  api: any;
  onClose?: () => void;
}

const ArtistManager: React.FC<ArtistManagerProps> = ({ api, onClose }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 加载CSV数据
  const loadArtists = async () => {
    try {
      setLoading(true);
      const response = await api.fetchApi('/power_artist_loader/csv/read');
      const data = await response.json();
      
      if (data.success) {
        setArtists(data.artists);
        setMessage('');
      } else {
        setMessage('Failed to load artists: ' + data.error);
      }
    } catch (error) {
      setMessage('Error loading artists: ' + error);
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存CSV数据
  const saveArtists = async () => {
    try {
      setSaving(true);
      const response = await api.fetchApi('/power_artist_loader/csv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✓ Saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save: ' + data.error);
      }
    } catch (error) {
      setMessage('Error saving: ' + error);
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // 添加新画师
  const addArtist = () => {
    setArtists([...artists, { name: '', keywords: '', image: '' }]);
  };

  // 删除画师
  const deleteArtist = (index: number) => {
    setArtists(artists.filter((_, i) => i !== index));
  };

  // 更新画师信息
  const updateArtist = (index: number, field: keyof Artist, value: string) => {
    const newArtists = [...artists];
    newArtists[index][field] = value;
    setArtists(newArtists);
  };

  useEffect(() => {
    loadArtists();
  }, []);

  if (loading) {
    return <div className="artist-manager-loading">Loading artists...</div>;
  }

  return (
    <div className="artist-manager">
      <div className="artist-manager-header">
        <h2>🎨 Artist Library Manager</h2>
        <div className="artist-manager-actions">
          <button onClick={addArtist} className="btn btn-add">
            + Add Artist
          </button>
          <button onClick={saveArtists} disabled={saving} className="btn btn-save">
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={loadArtists} className="btn btn-refresh">
            🔄 Refresh
          </button>
          {onClose && (
            <button onClick={onClose} className="btn btn-close">
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`artist-manager-message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="artist-table-container">
        <table className="artist-table">
          <thead>
            <tr>
              <th className="col-name">Artist Name</th>
              <th className="col-keywords">Keywords</th>
              <th className="col-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((artist, index) => (
              <tr key={index}>
                <td className="col-name">
                  <div className="artist-name-cell">
                    <span className="artist-index">{index + 1}</span>
                    <input
                      type="text"
                      value={artist.name}
                      onChange={(e) => updateArtist(index, 'name', e.target.value)}
                      placeholder="Artist name"
                      className="input-field"
                    />
                  </div>
                  <input
                    type="text"
                    value={artist.image}
                    onChange={(e) => updateArtist(index, 'image', e.target.value)}
                    placeholder="image.jpg"
                    className="input-field input-image"
                  />
                </td>
                <td className="col-keywords">
                  <textarea
                    value={artist.keywords}
                    onChange={(e) => updateArtist(index, 'keywords', e.target.value)}
                    placeholder="Keywords"
                    className="textarea-field"
                  />
                </td>
                <td className="col-actions">
                  <button
                    onClick={() => deleteArtist(index)}
                    className="btn btn-delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="artist-manager-footer">
        <p className="artist-count">📊 Total: <strong>{artists.length}</strong> artists</p>
        <p className="help-text">
          Format: name;keywords;image.jpg | Save updates artists.csv
        </p>
      </div>
    </div>
  );
};

export default ArtistManager;
