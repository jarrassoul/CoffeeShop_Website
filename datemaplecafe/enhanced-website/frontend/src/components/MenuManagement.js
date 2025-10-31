import React, { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';

const MenuManagement = () => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        isAvailable: true,
        isFeatured: false,
        allergens: '',
        preparationTime: '5'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesRes, itemsRes] = await Promise.all([
                menuAPI.getCategories(),
                menuAPI.getItems()
            ]);

            if (categoriesRes.success) {
                setCategories(categoriesRes.categories);
            }
            if (itemsRes.success) {
                setMenuItems(itemsRes.items);
            }
        } catch (error) {
            console.error('Error loading menu data:', error);
            setError('Failed to load menu data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                preparationTime: parseInt(formData.preparationTime),
                categoryId: parseInt(formData.categoryId)
            };

            if (editingItem) {
                await menuAPI.updateItem(editingItem.id, itemData);
            } else {
                await menuAPI.createItem(itemData);
            }

            // Reset form
            setFormData({
                name: '',
                description: '',
                price: '',
                categoryId: '',
                imageUrl: '',
                isAvailable: true,
                isFeatured: false,
                allergens: '',
                preparationTime: '5'
            });
            setShowAddForm(false);
            setEditingItem(null);

            // Reload data
            loadData();
        } catch (error) {
            console.error('Error saving menu item:', error);
            setError(error.response?.data?.message || 'Failed to save menu item');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price.toString(),
            categoryId: item.category_id.toString(),
            imageUrl: item.image_url || '',
            isAvailable: Boolean(item.is_available),
            isFeatured: Boolean(item.is_featured),
            allergens: item.allergens || '',
            preparationTime: item.preparation_time?.toString() || '5'
        });
        setEditingItem(item);
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) {
            return;
        }

        try {
            await menuAPI.deleteItem(id);
            loadData();
        } catch (error) {
            console.error('Error deleting menu item:', error);
            setError('Failed to delete menu item');
        }
    };

    const cancelForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: '',
            imageUrl: '',
            isAvailable: true,
            isFeatured: false,
            allergens: '',
            preparationTime: '5'
        });
        setShowAddForm(false);
        setEditingItem(null);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Loading menu...</div>;
    }

    return (
        <div className="menu-management">
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>🍽️ Menu Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Add New Item
                </button>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {showAddForm && (
                <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label>Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div>
                            <label>Category *</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                style={{ width: '100%', padding: '8px', marginTop: '5px', resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <label>Price ($) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div>
                            <label>Preparation Time (minutes)</label>
                            <input
                                type="number"
                                name="preparationTime"
                                value={formData.preparationTime}
                                onChange={handleInputChange}
                                min="1"
                                max="120"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label>Image URL</label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div>
                            <label>Allergens</label>
                            <input
                                type="text"
                                name="allergens"
                                value={formData.allergens}
                                onChange={handleInputChange}
                                placeholder="e.g., Nuts, Dairy, Gluten"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleInputChange}
                                />
                                Available
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={handleInputChange}
                                />
                                Featured Item
                            </label>
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingItem ? 'Update Item' : 'Add Item'}
                            </button>
                            <button
                                type="button"
                                onClick={cancelForm}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Menu Items Display */}
            <div>
                {categories.map(category => (
                    <div key={category.id} style={{ marginBottom: '30px' }}>
                        <h3 style={{
                            backgroundColor: '#f8f9fa',
                            padding: '10px',
                            borderRadius: '4px',
                            margin: '0 0 15px 0'
                        }}>
                            {category.name}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                            {menuItems
                                .filter(item => item.category_id === category.id)
                                .map(item => (
                                    <div key={item.id} style={{
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        backgroundColor: item.is_available ? 'white' : '#f8f9fa'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 5px 0', color: item.is_available ? '#333' : '#666' }}>
                                                    {item.name}
                                                    {item.is_featured && (
                                                        <span style={{
                                                            backgroundColor: '#ffc107',
                                                            color: '#212529',
                                                            fontSize: '0.7em',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            marginLeft: '8px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            FEATURED
                                                        </span>
                                                    )}
                                                </h4>
                                                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9em' }}>
                                                    {item.description}
                                                </p>
                                                <div style={{ fontSize: '0.85em', color: '#666' }}>
                                                    <div><strong>Price:</strong> ${item.price}</div>
                                                    <div><strong>Prep Time:</strong> {item.preparation_time} min</div>
                                                    {item.allergens && <div><strong>Allergens:</strong> {item.allergens}</div>}
                                                    <div style={{ marginTop: '5px' }}>
                                                        <span style={{
                                                            backgroundColor: item.is_available ? '#28a745' : '#dc3545',
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '3px',
                                                            fontSize: '0.8em'
                                                        }}>
                                                            {item.is_available ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '10px' }}>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    style={{
                                                        backgroundColor: '#ffc107',
                                                        color: '#212529',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8em'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8em'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {menuItems.filter(item => item.category_id === category.id).length === 0 && (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No items in this category</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuManagement;