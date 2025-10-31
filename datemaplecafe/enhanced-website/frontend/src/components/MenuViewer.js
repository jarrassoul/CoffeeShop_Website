import React, { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';

const MenuViewer = ({ viewMode = 'staff' }) => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadMenuData();
    }, []);

    const loadMenuData = async () => {
        try {
            const [categoriesRes, itemsRes] = await Promise.all([
                menuAPI.getCategories(),
                menuAPI.getItems()
            ]);

            if (categoriesRes.success) {
                setCategories(categoriesRes.categories);
            }
            if (itemsRes.success) {
                // Only show available items for cashiers
                const items = viewMode === 'cashier'
                    ? itemsRes.items.filter(item => item.is_available)
                    : itemsRes.items;
                setMenuItems(items);
            }
        } catch (error) {
            console.error('Error loading menu data:', error);
            setError('Failed to load menu data');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category_id === parseInt(selectedCategory));

    const groupedItems = categories.reduce((acc, category) => {
        const categoryItems = filteredItems.filter(item => item.category_id === category.id);
        if (categoryItems.length > 0) {
            acc[category.id] = {
                category,
                items: categoryItems
            };
        }
        return acc;
    }, {});

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Loading menu...</div>;
    }

    return (
        <div className="menu-viewer">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2>
                    {viewMode === 'cashier' ? '💰 Menu - Order Processing' : '👁️ Menu View'}
                </h2>

                <div>
                    <label htmlFor="category-filter" style={{ marginRight: '10px', fontWeight: 'bold' }}>
                        Filter by Category:
                    </label>
                    <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
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

            {viewMode === 'cashier' && (
                <div style={{
                    backgroundColor: '#d1ecf1',
                    color: '#0c5460',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <strong>💡 Cashier Mode:</strong> Only available items are shown. Use this view to help customers with menu questions and process orders.
                </div>
            )}

            <div className="menu-display">
                {Object.keys(groupedItems).length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <h3>No menu items found</h3>
                        <p>
                            {selectedCategory === 'all'
                                ? 'No menu items are currently available.'
                                : 'No items found in the selected category.'
                            }
                        </p>
                    </div>
                ) : (
                    Object.values(groupedItems).map(({ category, items }) => (
                        <div key={category.id} style={{ marginBottom: '40px' }}>
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                borderLeft: '4px solid #007bff'
                            }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>
                                    {category.name}
                                </h3>
                                {category.description && (
                                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9em' }}>
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: viewMode === 'cashier'
                                    ? 'repeat(auto-fit, minmax(350px, 1fr))'
                                    : 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '20px'
                            }}>
                                {items.map(item => (
                                    <div key={item.id} style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transition: 'box-shadow 0.2s',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    }}
                                    >
                                        {/* Featured badge */}
                                        {item.is_featured && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '15px',
                                                right: '15px',
                                                backgroundColor: '#ffc107',
                                                color: '#212529',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.7em',
                                                fontWeight: 'bold'
                                            }}>
                                                ⭐ FEATURED
                                            </div>
                                        )}

                                        <div style={{ paddingRight: item.is_featured ? '80px' : '0' }}>
                                            <h4 style={{
                                                margin: '0 0 8px 0',
                                                color: '#333',
                                                fontSize: '1.1em',
                                                fontWeight: 'bold'
                                            }}>
                                                {item.name}
                                            </h4>

                                            {item.description && (
                                                <p style={{
                                                    margin: '0 0 15px 0',
                                                    color: '#666',
                                                    fontSize: '0.9em',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {item.description}
                                                </p>
                                            )}

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '15px'
                                            }}>
                                                <div style={{
                                                    fontSize: '1.2em',
                                                    fontWeight: 'bold',
                                                    color: '#28a745'
                                                }}>
                                                    ${parseFloat(item.price).toFixed(2)}
                                                </div>

                                                <div style={{
                                                    fontSize: '0.85em',
                                                    color: '#666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    ⏱️ {item.preparation_time} min
                                                </div>
                                            </div>

                                            {viewMode !== 'cashier' && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <span style={{
                                                        backgroundColor: item.is_available ? '#d4edda' : '#f8d7da',
                                                        color: item.is_available ? '#155724' : '#721c24',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8em',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.is_available ? '✅ Available' : '❌ Unavailable'}
                                                    </span>
                                                </div>
                                            )}

                                            {item.allergens && (
                                                <div style={{
                                                    fontSize: '0.8em',
                                                    color: '#dc3545',
                                                    backgroundColor: '#f8d7da',
                                                    padding: '5px 8px',
                                                    borderRadius: '4px',
                                                    marginTop: '10px'
                                                }}>
                                                    <strong>⚠️ Allergens:</strong> {item.allergens}
                                                </div>
                                            )}

                                            {viewMode === 'cashier' && (
                                                <div style={{ marginTop: '15px' }}>
                                                    <button style={{
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9em',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Add to Order
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MenuViewer;