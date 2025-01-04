export default function PinCard({ pin }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover-lift">
      <div className="aspect-w-16 aspect-h-9 overflow-hidden">
          <img
              src={pin.image_url}
              alt={pin.title}
              className="w-full h-64 object-cover rounded-md mb-4"      
          />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{pin.title}</h3>
        <p className="text-secondary text-sm mb-3">{pin.description}</p>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">{pin.username || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
