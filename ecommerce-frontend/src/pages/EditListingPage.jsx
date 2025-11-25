// src/pages/EditListingPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/CreateListingPage.css';

const EditListingPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        itemCondition: '',
        location: '',
    });

    // Image state
    const [existingImages, setExistingImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [mainImageId, setMainImageId] = useState(null);

    // Specifications state
    const [specifications, setSpecifications] = useState([]);
    const [newSpec, setNewSpec] = useState({ name: '', value: '' });

    // Categories
    const [categories, setCategories] = useState([]);

    // Status state
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Load product data and categories when component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch product details
                const productResponse = await productService.getProductById(id);
                const product = productResponse.data.product;

                // Check if user is the owner of this product
                if (user.id !== product.seller_id) {
                    setError('You are not authorized to edit this listing');
                    return;
                }

                // Fetch categories
                const categoriesResponse = await categoryService.getCategories();
                setCategories(categoriesResponse.data.categories);

                // Set form data
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price ? product.price.toString() : '',
                    categoryId: product.category_id || '',
                    itemCondition: product.item_condition || 'Used - Good',
                    location: product.location || 'UTA Campus',
                });

                // Set specifications
                if (product.specifications && product.specifications.length > 0) {
                    setSpecifications(product.specifications.map(spec => ({
                        id: spec.id,
                        name: spec.name,
                        value: spec.value
                    })));
                }

                // Set existing images
                if (product.images && product.images.length > 0) {
                    setExistingImages(product.images);

                    // Find the main image
                    const mainImage = product.images.find(img => img.is_main);
                    if (mainImage) {
                        setMainImageId(mainImage.id);
                    }
                }

            } catch (err) {
                console.error('Error fetching product details:', err);
                setError('Failed to load product details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user.id]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle price as a special case to ensure it's a valid number
        if (name === 'price') {
            // Allow empty string or valid numbers with up to 2 decimal places
            if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear validation error for this field if it exists
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle image selection
    const handleImageChange = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            // Check if total images would exceed 5
            if (existingImages.length + imageFiles.length + selectedFiles.length > 5) {
                setError('You can upload a maximum of 5 images.');
                return;
            }

            // Update image files state
            setImageFiles(prev => [...prev, ...selectedFiles]);

            // Create preview URLs
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setImagePreview(prev => [...prev, ...newPreviews]);
        }
    };

    // Remove an existing image
    const handleRemoveExistingImage = async (imageId) => {
        try {
            await productService.removeProductImage(id, imageId);

            // Update state
            setExistingImages(prev => prev.filter(img => img.id !== imageId));

            // If this was the main image, reset mainImageId
            if (mainImageId === imageId) {
                setMainImageId(null);
            }

            setSuccess('Image removed successfully.');
        } catch (err) {
            console.error('Error removing image:', err);
            setError('Failed to remove image. Please try again.');
        }
    };

    // Remove a new image
    const handleRemoveNewImage = (index) => {
        // Release the object URL to avoid memory leaks
        URL.revokeObjectURL(imagePreview[index]);

        // Remove from states
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    // Set main image
    const handleSetMainImage = async (imageId) => {
        try {
            await productService.setMainProductImage(id, imageId);

            // Update state
            setMainImageId(imageId);
            setExistingImages(prev =>
                prev.map(img => ({
                    ...img,
                    is_main: img.id === imageId
                }))
            );

            setSuccess('Main image updated successfully.');
        } catch (err) {
            console.error('Error setting main image:', err);
            setError('Failed to set main image. Please try again.');
        }
    };

    // Handle spec input changes
    const handleSpecChange = (e) => {
        const { name, value } = e.target;
        setNewSpec(prev => ({ ...prev, [name]: value }));
    };

    // Add a new specification
    const handleAddSpec = async () => {
        if (newSpec.name.trim() === '' || newSpec.value.trim() === '') {
            return;
        }

        try {
            // Add spec to the server
            const response = await productService.addProductSpecification(id, {
                name: newSpec.name,
                value: newSpec.value
            });

            // Add to local state with the returned ID
            setSpecifications(prev => [...prev, {
                id: response.data.specificationId,
                name: newSpec.name,
                value: newSpec.value
            }]);

            setNewSpec({ name: '', value: '' });
            setSuccess('Specification added successfully.');
        } catch (err) {
            console.error('Error adding specification:', err);
            setError('Failed to add specification. Please try again.');
        }
    };

    // Update an existing specification
    const handleUpdateSpec = async (specId, value) => {
        try {
            await productService.updateProductSpecification(id, specId, { value });

            // Update in local state
            setSpecifications(prev =>
                prev.map(spec => spec.id === specId ? { ...spec, value } : spec)
            );

            setSuccess('Specification updated successfully.');
        } catch (err) {
            console.error('Error updating specification:', err);
            setError('Failed to update specification. Please try again.');
        }
    };

    // Remove a specification
    const handleRemoveSpec = async (specId) => {
        try {
            await productService.removeProductSpecification(id, specId);

            // Remove from local state
            setSpecifications(prev => prev.filter(spec => spec.id !== specId));

            setSuccess('Specification removed successfully.');
        } catch (err) {
            console.error('Error removing specification:', err);
            setError('Failed to remove specification. Please try again.');
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) errors.name = 'Product name is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (!formData.price) errors.price = 'Price is required';
        if (parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
        if (!formData.categoryId) errors.categoryId = 'Category is required';
        if (!formData.itemCondition) errors.itemCondition = 'Condition is required';
        if (!formData.location) errors.location = 'Location is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous status
        setError(null);
        setSuccess(null);

        // Validate form
        if (!validateForm()) {
            setError('Please fill in all required fields correctly.');
            return;
        }

        setSubmitting(true);

        try {
            // Update the product
            const productData = {
                ...formData,
                price: parseFloat(formData.price)
            };

            await productService.updateProduct(id, productData);

            // Upload new images if any
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });

                await productService.uploadProductImages(id, formData);
            }

            setSuccess('Product updated successfully!');

            // Redirect to the product page after 2 seconds
            setTimeout(() => {
                navigate(`/product/${id}`);
            }, 2000);

        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.response?.data?.message || 'Failed to update product. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to get image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/placeholder-image.jpg';

        // Check if the image URL is already a full URL
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // If it starts with /uploads/, prepend the API URL
        if (imageUrl.startsWith('/uploads/')) {
            // For Vite, use import.meta.env instead of process.env
            const apiBase = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace('/api', '')
                : '';
            return `${apiBase}${imageUrl}`;
        }

        // If it's an absolute path but not starting with /uploads/
        if (imageUrl.startsWith('/')) {
            return imageUrl;
        }

        // Return placeholder if image is not available
        return '/placeholder-image.jpg';
    };

    // Pre-defined condition options
    const conditionOptions = [
        'New',
        'Used - Like New',
        'Used - Good',
        'Used - Fair',
        'Used - Acceptable'
    ];

    // Location options (could be expanded)
    const locationOptions = [
        'UTA Campus',
        'Off Campus Housing',
        'Arlington Area',
        'Other'
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading product details...</p>
            </div>
        );
    }

    if (error && error === 'You are not authorized to edit this listing') {
        return (
            <div className="error-container">
                <h2>Not Authorized</h2>
                <p>{error}</p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/seller')}
                >
                    Return to Seller Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="create-listing-page">
            <div className="page-header">
                <h1>Edit Listing</h1>
                <p>Update your product information</p>
            </div>

            {/* Status messages */}
            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <p>{success}</p>
                </div>
            )}

            <form className="listing-form" onSubmit={handleSubmit}>
                <div className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label htmlFor="name">Product Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={validationErrors.name ? 'error' : ''}
                            placeholder="e.g., Calculus Textbook 8th Edition"
                        />
                        {validationErrors.name && <p className="error-message">{validationErrors.name}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={validationErrors.description ? 'error' : ''}
                            placeholder="Describe your item in detail. Include condition, features, and any defects."
                            rows="5"
                        />
                        {validationErrors.description && <p className="error-message">{validationErrors.description}</p>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="price">Price ($) *</label>
                            <input
                                type="text"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className={validationErrors.price ? 'error' : ''}
                                placeholder="e.g., 29.99"
                            />
                            {validationErrors.price && <p className="error-message">{validationErrors.price}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="categoryId">Category *</label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                className={validationErrors.categoryId ? 'error' : ''}
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name} {category.icon}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.categoryId && <p className="error-message">{validationErrors.categoryId}</p>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="itemCondition">Condition *</label>
                            <select
                                id="itemCondition"
                                name="itemCondition"
                                value={formData.itemCondition}
                                onChange={handleInputChange}
                                className={validationErrors.itemCondition ? 'error' : ''}
                            >
                                {conditionOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {validationErrors.itemCondition && <p className="error-message">{validationErrors.itemCondition}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location *</label>
                            <select
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={validationErrors.location ? 'error' : ''}
                            >
                                {locationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {validationErrors.location && <p className="error-message">{validationErrors.location}</p>}
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Product Images</h2>
                    <p className="section-description">Manage your product images. You can have up to 5 images total.</p>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="existing-images">
                            <h3>Current Images</h3>
                            <div className="image-previews">
                                {existingImages.map((image) => (
                                    <div key={image.id} className="image-preview-item">
                                        <img src={getImageUrl(image.image_url)} alt="Product" />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={() => handleRemoveExistingImage(image.id)}
                                        >
                                            &times;
                                        </button>
                                        {image.is_main && <div className="main-image-badge">Main</div>}
                                        {!image.is_main && (
                                            <button
                                                type="button"
                                                className="set-main-btn"
                                                onClick={() => handleSetMainImage(image.id)}
                                            >
                                                Set as Main
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload New Images */}
                    {existingImages.length < 5 && (
                        <div className="image-upload-container">
                            <h3>Add New Images</h3>
                            <div className="image-upload-btn">
                                <label htmlFor="images">
                                    <div className="upload-btn-content">
                                        <i className="icon">📷</i>
                                        <span>Add Images</span>
                                    </div>
                                    <input
                                        type="file"
                                        id="images"
                                        name="images"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            {imagePreview.length > 0 && (
                                <div className="image-previews">
                                    {imagePreview.map((src, index) => (
                                        <div key={index} className="image-preview-item">
                                            <img src={src} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => handleRemoveNewImage(index)}
                                            >
                                                &times;
                                            </button>
                                            <div className="new-image-badge">New</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-section">
                    <h2>Specifications</h2>
                    <p className="section-description">Add details like brand, model, dimensions, etc.</p>

                    <div className="specs-container">
                        {specifications.map((spec) => (
                            <div key={spec.id} className="spec-item">
                                <div className="spec-content">
                                    <strong>{spec.name}:</strong> {spec.value}
                                </div>
                                <button
                                    type="button"
                                    className="remove-spec-btn"
                                    onClick={() => handleRemoveSpec(spec.id)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}

                        <div className="add-spec-form">
                            <input
                                type="text"
                                placeholder="Name (e.g., Brand)"
                                name="name"
                                value={newSpec.name}
                                onChange={handleSpecChange}
                            />
                            <input
                                type="text"
                                placeholder="Value (e.g., Apple)"
                                name="value"
                                value={newSpec.value}
                                onChange={handleSpecChange}
                            />
                            <button
                                type="button"
                                className="add-spec-btn"
                                onClick={handleAddSpec}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate(`/product/${id}`)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Updating...' : 'Update Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditListingPage;