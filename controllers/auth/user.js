const { request, gql, GraphQLClient } = require("graphql-request");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const { sendEmail } = require('../sendMessage')
dotenv.config();
const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    }
});

exports.login = async(req, res, next) => {

    const HASURA_OPERATION = `
query myQuery($email: String!){
users(where: {email: {_eq: $email}}) {
id
email
password
}
}`
    const { email, password } = req.body.input;
    try {
        const data = await client.request(HASURA_OPERATION, { email })
        console.log(data)
        if (data.users[0]) {
            const match = await bcrypt.compare(password, data.users[0].password);
            if (match) {
                const tokenContents = {
                    sub: 'user',
                    email: data.users[0].email,
                    uid: data.users[0].id,
                    "https://hasura.io/jwt/claims": {

                        "x-hasura-allowed-roles": ["user", "anonymous"],
                        "x-hasura-default-role": "user",
                        "x-hasura-user-id": data.users[0].id.toString(),
                    },
                };
                jwt.sign(
                    tokenContents,
                    process.env.JWT_SECRET, (err, token) => {
                        if (err) {
                            res.sendStatus(403)
                        } else {
                            return res.json({
                                ...data.users[0],
                                token: token
                            });
                        }

                    });

            } else {
                return res.status(400).json({ message: 'Password doesnt match' });
            }

        } else {
            return res.status(400).json({ message: 'User not found' });
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

}

exports.signUp = async(req, res, next) => {

    const HASURA_OPERATION = `mutation ($email: String!, $password: String!, $first_name: String!, $last_name: String!, $phone_number: String!, $user_name: String!, $verification_code: String!) {
  insert_users_one(object: {email: $email, password: $password, first_name: $first_name, last_name: $last_name, phone_number: $phone_number, user_name: $user_name, verification_code: $verification_code}) {
    id
    email
    password
  }
}


`;
  const ADD_BILLING_QUERY = `
  mutation ($user_id: uuid!) {
  insert_billing_and_shipping_addresses_one(object: {address1: "", address2: "", city: "", company_name: "", country: "", kebele: "", sub_city: "", zip_code: 10, user_id: $user_id}) {
    id
  }
}

  `
    const {
        email,
        password,
        first_name,
        last_name,
        user_name,
        phone_number,
        
    } = req.body.input;
    const hashedPassword = await bcrypt.hash(password, 10);
    let code = Math.floor(1000 + Math.random() * 900000).toString();
    try {
        const data = await client.request(HASURA_OPERATION, {
            email,
            password: hashedPassword,
            first_name,
            last_name,
            user_name,
            phone_number,
            verification_code:code,
            
        })

        if (data.insert_users_one) {
          await client.request(ADD_BILLING_QUERY, {
            user_id: data.insert_users_one.id
          })
            const tokenContents = {
                sub: 'user',
                email: data.insert_users_one.email,
                uid: data.insert_users_one.id,
                "https://hasura.io/jwt/claims": {

                    "x-hasura-allowed-roles": ["user", "anonymous"],
                    "x-hasura-default-role": "user",
                    "x-hasura-user-id": data.insert_users_one.id.toString(),
                },
            };
            const token = jwt.sign(
                tokenContents,
                process.env.JWT_SECRET, (err, token) => {
                    if (err) {
                        res.sendStatus(403)
                    } else {
                        sendEmail(email, code.toString(), 'Here is your Verification code').then((email) => {
                            console.log("res", email)
                            return res.json({
                                ...data.insert_users_one,
                                token: token

                            });
                        }).catch(err => {
                            return res.status(400).json({ message: 'Email sending falied' });
                        })

                    }
                });

        } else {
            return res.status(400).json({ message: "signup failed" });
        }
    } catch (err) {
        console.log(err.response.errors[0].message)
        if (err.response.errors[0].message === 'Uniqueness violation. duplicate key value violates unique constraint \"users_email_key\"') {
            return res.status(400).json({ message: 'There is a user with this email' });
        } else {
            return res.status(400).json({ message: err.message });
        }
    }

}


exports.verify = async(req, res, next) => {
    const HASURA_OPERATION = `
mutation ($id: uuid!, $verification_code: String!) {
  update_users(where: {id: {_eq: $id}, _and: {verification_code: {_eq: $verification_code}}}, _set: {is_verified: true}) {
    returning {
      id
      email
      is_verified
    }
  }
}

`;
    const { id, code } = req.body.input;
    try {
        const data = await client.request(HASURA_OPERATION, { id, verification_code:code })
        console.log(data)
        if (data.update_users.returning[0]) {
 sendEmail( data.update_users.returning[0].email, "Thank you", 'You are successfully verified').then((email) => {
                           
                            res.json({
                ...data.update_users.returning[0]
            })
                        }).catch(err => {
                            return res.status(400).json({ message: 'Email sending falied' });
                        })
            
        } else {
            return res.status(400).json({ message: 'Cannot verify please try again' });
        }
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

}

exports.forgotPassword = async(req, res, next) => {
    console.log("forgot password")
    const HASURA_OPERATION = `mutation ($email: String!, $password: String!) {
  update_users(where: {email: {_eq: $email}}, _set: {password: $password}) {
    returning {
      id
    }
  }
}

`;
    const { email } = req.body.input;
    let generatedPassword = Math.floor(1000 + Math.random() * 900000000);
    const hashedPassword = await bcrypt.hash(generatedPassword.toString(), 10);
    console.log(generatedPassword)
    try {
        const data = await client.request(HASURA_OPERATION, { email, password: hashedPassword })
        console.log(data)
        if (data.update_users.returning[0]) {


            sendEmail(email, generatedPassword.toString(), 'Here is your New password').then((email) => {
                console.log("res", email)
                res.json({
                    ...data.update_users.returning[0]
                })
            }).catch(err => {
                return res.status(400).json({ message: 'Email sending falied' });
            })


        } else {
            return res.status(400).json({ message: 'There is no such user' });
        }

    } catch (err) {
        return res.status(400).json({ message: err.message });
    }



}

exports.changePassword = async(req, res, next) => {
    const HASURA_OPERATION = `
mutation($id: uuid!, $new_password: String!) {
  update_users_by_pk(pk_columns: {id: $id}, _set: {password: $new_password}) {
    id
  }
}
`;
    const GET_USER_HASURA_OPERATION = `
query myQuery($id: uuid!){
users_by_pk(id: $id) {
id
email
password
}
}`
    const { id, new_password, old_password } = req.body.input;
    const hashedPassword = await bcrypt.hash(new_password.toString(), 10);
    try {
        const userData = await client.request(GET_USER_HASURA_OPERATION, { id })
        console.log(userData)

        if (userData.users_by_pk) {
            const match = await bcrypt.compare(old_password, userData.users_by_pk.password);
            const match_2 = await bcrypt.compare(new_password, userData.users_by_pk.password);
            if (match_2) return res.status(400).json({ message: 'Old password can not be your new password' });
            if (match) {
                const data = await client.request(HASURA_OPERATION, { id, new_password: hashedPassword })
                console.log(data)
                if (data.update_users_by_pk) {
                    console.log("good")
                    res.json({
                        ...data.update_users_by_pk
                    })
                } else {
                    return res.status(400).json({ message: 'Password Updating failed' });
                }

            } else {
                return res.status(400).json({ message: 'Your old password doesn\`t match' });
            }


        } else {
            return res.status(400).json({ message: 'There is no such user' });
        }

    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

}