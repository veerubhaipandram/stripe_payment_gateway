import React, { useEffect, useState } from "react";
import "./cartstyle.css";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  removeToCart,
  removeSingleIteams,
  emptycartIteam,
} from "../redux/features/cartSlice";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

const CartDetails = () => {
  const { carts } = useSelector((state) => state.allCart);
  const [totalprice, setPrice] = useState(0);
  const [totalquantity, setTotalQuantity] = useState(0);
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();

  const handleIncrement = (item) => dispatch(addToCart(item));
  const handleDecrement = (id) => {
    dispatch(removeToCart(id));
    toast.success("Item removed from cart");
  };
  const handleSingleDecrement = (item) => dispatch(removeSingleIteams(item));
  const emptycart = () => {
    dispatch(emptycartIteam());
    toast.success("Cart emptied");
  };

  useEffect(() => {
    let price = 0;
    let quantity = 0;
    carts.forEach((item) => {
      price += item.price * item.qnty;
      quantity += item.qnty;
    });
    setPrice(price);
    setTotalQuantity(quantity);
  }, [carts]);

  const makePayment = async () => {
    if (!email) return toast.error("Please enter your email.");
    if (carts.length === 0) return toast.error("Your cart is empty.");

    const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

    if (!stripeKey || typeof stripeKey !== "string") {
      toast.error("Stripe key is missing or invalid");
      console.error("Missing or invalid Stripe publishable key.");
      return;
    }

    try {
      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        toast.error("Stripe failed to initialize.");
        return;
      }

      const response = await fetch("http://localhost:7000/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: carts.map((item) => ({
            name: item.dish,
            price: item.price,
            quantity: item.qnty,
          })),
          email,
        }),
      });

console.log("Stripe Key:", process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY); // Should log your pk_test_xxx key

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);


      const data = await response.json();

      if (!response.ok || !data.id) {
        toast.error(data.message || "Unable to create checkout session.");
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.id,
      });

      if (result.error) {
        toast.error(result.error.message);
      }
    } catch (err) {
      console.error("Stripe redirect error:", err);
      toast.error("Payment failed. Check console for details.");
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="card shadow-lg">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="m-0">Cart ({carts.length})</h5>
          {carts.length > 0 && (
            <button className="btn btn-sm btn-danger" onClick={emptycart}>
              <i className="fa fa-trash-alt me-1"></i>Empty Cart
            </button>
          )}
        </div>

        <div className="card-body">
          {carts.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-shopping-cart fa-3x text-secondary mb-3"></i>
              <p className="lead">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="Enter your email to continue"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Action</th>
                      <th>Product</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carts.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDecrement(item.id)}
                          >
                            <i className="fa fa-trash-alt"></i>
                          </button>
                        </td>
                        <td>
                          <img
                            src={item.imgdata}
                            alt={item.dish}
                            className="img-fluid rounded"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                            }}
                          />
                        </td>
                        <td>{item.dish}</td>
                        <td>₹ {item.price}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                item.qnty <= 1
                                  ? handleDecrement(item.id)
                                  : handleSingleDecrement(item)
                              }
                            >
                              <i className="fa fa-minus"></i>
                            </button>
                            <input
                              type="text"
                              className="form-control form-control-sm mx-2 text-center"
                              style={{ width: "50px" }}
                              value={item.qnty}
                              readOnly
                            />
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleIncrement(item)}
                            >
                              <i className="fa fa-plus"></i>
                            </button>
                          </div>
                        </td>
                        <td className="text-end fw-bold">
                          ₹ {item.qnty * item.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
                <div>
                  <p className="mb-1 fw-bold">
                    Items in Cart:{" "}
                    <span className="text-primary">{totalquantity}</span>
                  </p>
                  <p className="mb-0 fw-bold">
                    Total Price:{" "}
                    <span className="text-success">₹ {totalprice}</span>
                  </p>
                </div>
                <button
                  onClick={makePayment}
                  className="btn btn-success btn-lg px-4"
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDetails;
