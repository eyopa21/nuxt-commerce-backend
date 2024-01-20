const { request, gql, GraphQLClient } = require("graphql-request");


const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    }
});

exports.addToCart = async(req, res, next) => {
  
  const {product_id, user_id, quantity} = req.body.input;
  
  const GET_CARTS = 
      `query myQuery($product_id: uuid!, $user_id: uuid!){
  carts(where: {product_id: {_eq: $product_id}, user_id: {_eq: $user_id}}) {
    id
  }
}`
  
  const ADD_OPERATION = `
  mutation ($user_id: uuid!, $product_id: uuid!, $quantity: Int!) {
  insert_carts_one(
    object: { product_id: $product_id, quantity: $quantity, user_id: $user_id }
  ) {
    id
  }
}
` 
  const UPDATE_OPERATION = `
  mutation ($cart_id: uuid!, $quantity: Int!) {
  update_carts_by_pk(pk_columns: {id: $cart_id}, _inc: {quantity: $quantity}) {
    id
  }
}
`
  
  
  try {
        const data = await client.request(GET_CARTS, {
          product_id, 
          user_id
            
        })

        if (data.carts[0]) {
          console.log("update")
          const updateData = await client.request(UPDATE_OPERATION, {
           cart_id: data.carts[0].id,
          quantity
            
        })
          if(updateData.update_carts_by_pk){
             res.json({
                    ...updateData.update_carts_by_pk
          })
          }else(err => {
          console.log(err)
            return res.status(400).json({ message: 'Updating cart failed' });
        })
         
          
        }else {
          console.log("add to cart")
          const addData = await client.request(ADD_OPERATION, {
          product_id, 
          user_id,
            quantity
            
        })
          if(addData.insert_carts_one){
             res.json({
                    ...addData.insert_carts_one
          })
          }else(err => {
          console.log(err)
            return res.status(400).json({ message: 'Adding cart failed' });
        })
          
  }
}catch(err) {
     return res.status(400).json({ message: 'Adding cart failed' });
  }
  
  
}



exports.order = async(req, res) => {
  const HASURA_OPERATION = `
mutation($user_id: uuid!, $tax: numeric!, $subtotal: numeric!, $status: String!, $shipping: numeric!, $products: jsonb!, $payment_method: String!, $billing_id: uuid!, $total: numeric!, $note: String) {
  insert_orders_one(object: {user_id: $user_id, tax: $tax, subtotal: $subtotal, status: $status, shipping: $shipping, products: $products, payment_method: $payment_method, billing_id: $billing_id, total: $total, note: $note}) {
    id
  }
}
`;
  
  const { user_id, subtotal, products, payment_method, billing_id, note } = req.body.input;
  let total = 0;
     products?.forEach(item => {
        // console.log("itemmm", item.quantity*item.product.price)
       total+=item.quantity*item.product.price
     })
  
  try{
    
     const data = await client.request(HASURA_OPERATION, {
          user_id, tax:(total*15)/100, subtotal:total, status: "pending", shipping:500, products, payment_method,billing_id, note, total:total+500+(total*15/100)
            
        })
     
     if(data.insert_orders_one){
       res.json({
                    ...data.insert_orders_one
          })
     }
    else {
          
            return res.status(400).json({ message: 'Ordering failed' });
          }
    
          
    
    
  }catch(error) {
    console.log("ordor error", error)
    return res.status(400).json({ message: 'Ordering failed' });
  }
  
  
}