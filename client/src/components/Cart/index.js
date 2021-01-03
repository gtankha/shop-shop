import CartItem from '../CartItem';
import Auth from '../../utils/auth';
import './style.css';
import React, { useEffect } from "react";
import { TOGGLE_CART, ADD_MULTIPLE_TO_CART } from "../../utils/actions";
import { idbPromise } from "../../utils/helpers"
import { QUERY_CHECKOUT } from '../../utils/queries';
import { loadStripe } from '@stripe/stripe-js';
import { useLazyQuery } from '@apollo/react-hooks';
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'


const Cart = () => {
    const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
    // get cart and cartOpen info from state
    const cartI = state => state.cart;
    const cart = useSelector(cartI);
    const stateCartI = state => state.cartOpen;
    const cartOpen = useSelector(stateCartI);

    // dispatch using redux
    const dispatch = useDispatch();
    const [getCheckout, { data }] = useLazyQuery(QUERY_CHECKOUT);
    useEffect(() => {
        if (data) {
          stripePromise.then((res) => {
            res.redirectToCheckout({ sessionId: data.checkout.session });
          });
        }
      }, [data]);
    useEffect(() => {
        async function getCart() {
          const cart = await idbPromise('cart', 'get');
          dispatch({ type: ADD_MULTIPLE_TO_CART, products: [...cart] });
        };
      
        if (!cart.length) {
          getCart();
        }
      }, [cart.length, dispatch]);


    function toggleCart() {
        dispatch({ type: TOGGLE_CART });
    }
    if (!cartOpen) {
        return (
            <div className="cart-closed" onClick={toggleCart}>
                <span
                    role="img"
                    aria-label="trash">🛒</span>
            </div>
        );
    }
    function calculateTotal() {
        let sum = 0;
        cart.forEach(item => {
            sum += item.price * item.purchaseQuantity;
        });
        return sum.toFixed(2);
    }
    function submitCheckout() {
        const productIds = [];
      
        cart.forEach((item) => {
          for (let i = 0; i < item.purchaseQuantity; i++) {
            productIds.push(item._id);
            console.log("check it out");
            console.log(productIds);
          }
        });
        getCheckout({
            variables: { products: productIds }
          });
      }
    return (
        <div className="cart">
            <div className="close" onClick={toggleCart}>[close]</div>
            <h2>Shopping Cart</h2>
            {cart.length ? (
                <div>
                    {cart.map(item => (
                        <CartItem key={item._id} item={item} />
                    ))}
                    <div className="flex-row space-between">
                        <strong>Total: ${calculateTotal()}</strong>
                        {
                            Auth.loggedIn() ?
                            <button onClick={submitCheckout}>
                            Checkout
                          </button>
                                :
                                <span>(log in to check out)</span>
                        }
                    </div>
                </div>
            ) : (
                    <h3>
                        <span role="img" aria-label="shocked">
                            😱
      </span>
      You haven't added anything to your cart yet!
                    </h3>
                )}
        </div>
    );
};

export default Cart;