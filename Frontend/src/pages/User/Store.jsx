import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/User/Store.css";
import vendorImage from '../../assets/store.jpg';
import Footer from "../../components/Footer";
import Navigationbar from "../../components/NavBar";

const StoreListing = () => {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/getstore") // Fetch all stores
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStores(data.data);
        } else {
          console.error("No stores found:", data.message);
        }
      })
      .catch((err) => console.error("Error fetching stores:", err));
  }, []);

  return (
    <div className="Store-page">
      <Navigationbar/>
    <div className="store-container">
      <h2 className="store-title">Explore Local Markets</h2>
      <div className="store-items">
        {stores.length === 0 ? (
          <p>No stores available</p>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="store-card">
            <img src={store.image ? store.image : vendorImage} alt={store.shop_name} className="store-image" />
            <div className="store-info">
              <h3 className="store-names">{store.shop_name}</h3>
              <p className="store-locations">{store.store_address}</p>
              <Link to={`/store/${store.id}`}>
                <button className="store-view-button">View Store</button>
              </Link>
            </div>
          </div>          
          ))
        )}
      </div>
    </div>
    <Footer/>
    </div>
  );
}

export default StoreListing;