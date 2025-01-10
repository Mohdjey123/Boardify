import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CldUploadWidget } from 'next-cloudinary';
import Navbar from '../components/Navbar';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import '../app/globals.css';

export default function CreatePin() {
  const [title, setTitle] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[150px]',
      },
    },
  });

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUploadSuccess = (result) => {
    console.log('Upload result:', result); // For debugging

    if (!result?.info?.secure_url) {
      setError('Failed to upload image. Please try again.');
      return;
    }

    const imageUrl = result.info.secure_url;
    
    setImageUrls(prev => {
      if (prev.length >= 5) {
        setError('Maximum 5 images allowed');
        return prev;
      }
      return [...prev, imageUrl];
    });
    
    setError(null);
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    setError('Failed to upload image: ' + (error.message || 'Unknown error'));
  };

  const removeImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!title.trim()) {
        throw new Error('Please enter a title');
      }

      if (!editor?.getHTML() || editor.getHTML() === '<p></p>') {
        throw new Error('Please enter a description');
      }

      const newPin = {
        title: title.trim(),
        description: editor.getHTML(),
        images: imageUrls.length > 0 
          ? imageUrls 
          : [null],
        username: user.displayName,
        richText: editor.getJSON()
      };

      const response = await axios.post('http://10.0.0.23:5000/api/pins', newPin);
      
      if (!response?.data) {
        throw new Error('Failed to create pin. Please try again.');
      }

      router.push('/');
    } catch (error) {
      setError(error.message || 'Error creating pin. Please try again later.');
      console.error('Error creating pin:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Boardify" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-primary">Create a Pin</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-4 rounded-xl border-2 border-blue shadow-sm">
            <label className="block font-semibold text-primary mb-2">
              Pin Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter a catchy title for your pin"
              maxLength={100}
              required
            />
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-blue shadow-sm">
            <label className="block font-semibold text-primary mb-2">
              Pin Description
            </label>
            <EditorContent 
              editor={editor} 
              className="min-h-[150px] border rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-blue shadow-sm">
            <label className="block font-semibold text-primary mb-2">
              Images {imageUrls.length > 0 && `(${imageUrls.length}/5)`}
            </label>
            
            {imageUrls.length < 5 && (
              <CldUploadWidget
                uploadPreset="boardify_preset"
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
                options={{
                  maxFiles: 1,
                  sources: ['local', 'url', 'camera'],
                  resourceType: "image",
                  clientAllowedFormats: ["png", "jpeg", "jpg", "gif"],
                  maxFileSize: 10000000,
                  showAdvancedOptions: false,
                  multiple: false,
                  styles: {
                    palette: {
                      window: "#FFFFFF",
                      windowBorder: "#90A0B3",
                      tabIcon: "#0078FF",
                      menuIcons: "#5A616A",
                      textDark: "#000000",
                      textLight: "#FFFFFF",
                      link: "#0078FF",
                      action: "#FF620C",
                      inactiveTabIcon: "#0E2F5A",
                      error: "#F44235",
                      inProgress: "#0078FF",
                      complete: "#20B832",
                      sourceBg: "#E4EBF1"
                    }
                  }
                }}
              >
                {({ open }) => (
                  <div 
                    onClick={() => open()}
                    className="border-2 border-dashed border-blue/30 rounded-lg p-6 text-center cursor-pointer
                             hover:bg-blue/5 transition-colors duration-200"
                  >
                    <PhotoIcon className="w-12 h-12 text-blue/40 mx-auto" />
                    <span className="mt-2 text-sm text-blue/60 block">
                      Click to upload images (max 5)
                    </span>
                  </div>
                )}
              </CldUploadWidget>
            )}

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-blue/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200
                               hover:bg-red-50"
                    >
                      <XMarkIcon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full p-3 rounded-lg font-medium text-white
                       ${loading 
                         ? 'bg-primary/50 cursor-not-allowed' 
                         : 'bg-primary hover:bg-primary/90 active:bg-primary/80'}
                       transition-colors duration-200`}
            disabled={loading}
          >
            {loading ? 'Creating Pin...' : 'Create Pin'}
          </button>
        </form>
      </div>
    </div>
  );
}