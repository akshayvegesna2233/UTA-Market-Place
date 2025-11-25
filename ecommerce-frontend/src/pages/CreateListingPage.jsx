import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/CreateListingPage.css';

const CreateListingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        itemCondition: 'Used - Good',
        location: 'UTA Campus',
    });

    // Image state
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);

    // Specifications state
    const [specifications, setSpecifications] = useState([]);
    const [newSpec, setNewSpec] = useState({ name: '', value: '' });

    // Categories
    const [categories, setCategories] = useState([]);

    // Status state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Load categories when component mounts
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryService.getCategories();
                setCategories(response.data.categories);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories. Please try again.');
            }
        };

        fetchCategories();
    }, []);

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
            if (imageFiles.length + selectedFiles.length > 5) {
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

    // Remove an image
    const handleRemoveImage = (index) => {
        // Release the object URL to avoid memory leaks
        URL.revokeObjectURL(imagePreview[index]);

        // Remove from states
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    // Handle spec input changes
    const handleSpecChange = (e) => {
        const { name, value } = e.target;
        setNewSpec(prev => ({ ...prev, [name]: value }));
    };

    // Add a new specification
    const handleAddSpec = () => {
        if (newSpec.name.trim() === '' || newSpec.value.trim() === '') {
            return;
        }

        setSpecifications(prev => [...prev, { ...newSpec }]);
        setNewSpec({ name: '', value: '' });
    };

    // Remove a specification
    const handleRemoveSpec = (index) => {
        setSpecifications(prev => prev.filter((_, i) => i !== index));
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

        setLoading(true);

        try {
            // First, create the product
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                specifications: specifications.length > 0 ? JSON.stringify(specifications) : undefined
            };

            const response = await productService.createProduct(productData);
            const productId = response.data.productId;

            // Then, upload images if any
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => {
                    formData.append('images', file);
                });

                await productService.uploadProductImages(productId, formData);
            }

            setSuccess('Product created successfully!');

            // Redirect to the product page after 2 seconds
            setTimeout(() => {
                navigate(`/product/${productId}`);
            }, 2000);

        } catch (err) {
            console.error('Error creating product:', err);
            setError(err.response?.data?.message || 'Failed to create product. Please try again.');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="create-listing-page">
            <div className="page-header">
                <h1>Create New Listing</h1>
                <p>List your item for sale to UTA students</p>
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
                    <p className="section-description">Upload up to 5 images of your item. The first image will be the main image.</p>

                    <div className="image-upload-container">
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

                        <div className="image-previews">
                            {imagePreview.map((src, index) => (
                                <div key={index} className="image-preview-item">
                                    <img src={src} alt={`Preview ${index + 1}`} />
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        &times;
                                    </button>
                                    {index === 0 && <div className="main-image-badge">Main</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Specifications (Optional)</h2>
                    <p className="section-description">Add details like brand, model, dimensions, etc.</p>

                    <div className="specs-container">
                        {specifications.map((spec, index) => (
                            <div key={index} className="spec-item">
                                <div className="spec-content">
                                    <strong>{spec.name}:</strong> {spec.value}
                                </div>
                                <button
                                    type="button"
                                    className="remove-spec-btn"
                                    onClick={() => handleRemoveSpec(index)}
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
                        onClick={() => navigate('/seller')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateListingPage;