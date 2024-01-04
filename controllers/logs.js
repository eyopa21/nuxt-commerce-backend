const { request, gql, GraphQLClient } = require("graphql-request");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const { sendEmail } = require('./sendMessage')
dotenv.config();
const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    }
});

exports.logs = async(req, res, next) => {
   const HASURA_OPERATION = `
     mutation($user_id: uuid!, $guest_id: uuid, $operation: String!, $email: String!, $description: String!, $table: String!) {
      insert_logs_one(object: {user_id: $user_id, guest_id: $guest_id, operation: $operation, email: $email, description: $description, table: $table}) {
    id
  }
}

`
  const QUERY = `query myQuery($id: uuid!){
  users_by_pk(id: $id) {
    first_name
    last_name
    email
    user_name
  }
  guests_by_pk(id: $id) {
    user_name
    email
  }
}
`
   const {event, table} = req.body;
//console.log(req.body)
let role ;
let guestId;
  let userId;
  if(Object.values( event.session_variables).length ===3) {
    console.log("guest")
    role = Object.values( event.session_variables)[1]
    guestId = Object.values( event.session_variables)[0]
     userId = Object.values( event.session_variables)[2]
  } else if(Object.values( event.session_variables).length ===2) {
    console.log("user")
    role = Object.values( event.session_variables)[0]
    guestId = null
     userId = Object.values( event.session_variables)[1]
  }

  try {
    const queryData = await client.request(QUERY, { id: guestId?'':userId})
    console.log(queryData)
    
   if(queryData.users_by_pk||queryData.guests_by_pk){
     let description = event.op=="UPDATE"? `${guestId? 'Guest '+queryData.guests_by_pk.user_name:'You'} ${event.op} information from ${JSON.stringify(event.data.old)} to ${JSON.stringify(event.data.new)}` : event.op=="INSERT"? `${guestId? 'Guest '+queryData.guests_by_pk.user_name:'You '} ${event.op} ${JSON.stringify(event.data.new)}` : `${guestId? 'Guest '+queryData.guests_by_pk.user_name:'You '} ${event.op} ${JSON.stringify(event.data.old)}`
  
      const data = await client.request(HASURA_OPERATION, { user_id: userId,guest_id:guestId, email: queryData.guests_by_pk?'':queryData.users_by_pk.email,operation: event.op, description, table: table.name})
        console.log("insert",data)
        if (data.insert_logs_one) {
            
             res.json({status: "success"});
        } else {
          
            return res.status(400).json({ message: 'Log inserting failed' });
        }
   }else {
       return res.status(400).json({ message: 'Log inserting failed' });
   }
       
       

    } catch (err) {
      console.log(err)
        return res.status(400).json({ message: err.message });
    }

     
}