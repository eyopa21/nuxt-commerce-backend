const { request, gql, GraphQLClient } = require("graphql-request");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require('./sendMessage')
const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    }
});
exports.registerGuest = async(req, res, next) => {
    const HASURA_OPERATION = `
    mutation($user_id: uuid!, $user_name: String!, $email: String!, $password: String!, $is_super_guest: Boolean!) {
  insert_guests_one(object: {user_id: $user_id, user_name: $user_name, email: $email, password: $password, is_super_guest: $is_super_guest}) {
    id
    password
  }
}
`
    const { user_id, user_name, email, is_super_guest } = req.body.input;
    let generatedPassword = Math.floor(1000 + Math.random() * 900000000);
    const hashedPassword = await bcrypt.hash(generatedPassword.toString(), 10);

    try {
        const data = await client.request(HASURA_OPERATION, { user_id, user_name, email, password: hashedPassword, is_super_guest })
        console.log("insert",data)
        if (data.insert_guests_one) {
            sendEmail(email, generatedPassword.toString(), 'Here is your invitation code').then((resEmail) => {
                console.log("res", resEmail)
                res.json({
                    ...data.insert_guests_one
                })
            }).catch(err => {
                return res.status(400).json({ message: 'Email sending falied' });
            })
        } else(err => {
          console.log(err)
            return res.status(400).json({ message: 'Inviting Guest failed' });
        })

    } catch (err) {
        return res.status(400).json({ message: err.message });
    }



}

exports.guestLogin = async(req, res, next) => {
    const HASURA_OPERATION = `
query($email: String!){
  guests(where: {email: {_eq: $email}}) {
    id
    user_id
    email
    user_name
    password
    is_verified
    is_suspended
    is_super_guest
    
  }
}
`;
    const { email, password } = req.body.input;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {

        const data = await client.request(HASURA_OPERATION, { email })
        console.log(data)
        if (data.guests[0]) {
            const match = await bcrypt.compare(password, data.guests[0].password);
            if (match) {
                const tokenContents = {
                    sub: 'guest',
                    email: data.guests[0].email,
                    uid: data.guests[0].id,
                    user_id: data.guests[0].user_id,
                    "https://hasura.io/jwt/claims": {

                        "x-hasura-allowed-roles": ["guest", "anonymous", 'super-guest'],
                        "x-hasura-default-role": `${data.guests[0].is_super_guest?'super-guest':'guest'}`,
                        "x-hasura-user-id": data.guests[0].user_id.toString(),
                        "x-hasura-guest-id": data.guests[0].id.toString()
                    },
                };
                jwt.sign(
                    tokenContents,
                    process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                        if (err) {
                            res.sendStatus(403)
                        } else {
                            return res.json({
                                ...data.guests[0],
                                token: token
                            });
                        }

                    });

            } else {
                return res.status(400).json({ message: 'Password doesnt match' });
            }

        } else {
            return res.status(400).json({ message: 'Guest not found' });
        }

    } catch (err) {
        return res.status(400).json({ message: err.message });
    }



}