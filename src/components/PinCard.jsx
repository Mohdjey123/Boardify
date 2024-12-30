export default function PinCard({ pin }) {
   return (
     <div className="border rounded-lg p-4">
       <img src={pin.imageUrl} alt={pin.title} className="w-full h-48 object-cover" />
       <h3 className="text-lg font-semibold">{pin.title}</h3>
       <p>{pin.description}</p>
     </div>
   );
 }
 