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