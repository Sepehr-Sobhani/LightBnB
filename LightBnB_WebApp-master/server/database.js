const { Pool } = require("pg");
const pool = new Pool({
  user: "vagrant",
  host: "localhost",
  database: "lightbnb",
  password: "123",
});

module.exports = {
  /// Users
  /**
   * Get a single user from the database given their email.
   * @param {String} email The email of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  getUserWithEmail: (email) => {
    const queryString = `SELECT DISTINCT * FROM users WHERE email = $1`;
    return pool
      .query(queryString, [email])
      .then((res) => {
        if (res.rows.length === 0) {
          return null;
        }
        return res.rows[0];
      })
      .catch((err) => console.error(err.stack));
  },
  /**
   * Get a single user from the database given their id.
   * @param {string} id The id of the user.
   * @return {Promise<{}>} A promise to the user.
   */
  getUserWithId: (id) => {
    const queryString = `SELECT DISTINCT * FROM users WHERE id = $1`;
    return pool
      .query(queryString, [id])
      .then((res) => {
        if (res.rows.length === 0) {
          return null;
        }
        return res.rows[0];
      })
      .catch((err) => console.error(err.stack));
  },
  /**
   * Add a new user to the database.
   * @param {{name: string, password: string, email: string}} user
   * @return {Promise<{}>} A promise to the user.
   */
  addUser: (user) => {
    const queryString = `INSERT INTO users (name, password, email) VALUES ($1, $2, $3) RETURNING *`;
    return pool
      .query(queryString, [user.name, user.password, user.email])
      .then((res) => console.log(res.rows))
      .catch((err) => console.error(err.stack));
  },
  /// Reservations

  /**
   * Get all reservations for a single user.
   * @param {string} guest_id The id of the user.
   * @return {Promise<[{}]>} A promise to the reservations.
   */
  getAllReservations: (guest_id, limit = 10) => {
    const queryString = `SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
        JOIN properties ON reservations.property_id = properties.id
        JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2`;
    return pool
      .query(queryString, [guest_id, limit])
      .then((res) => res.rows)
      .catch((err) => console.error(err.stack));
  },
  /// Properties

  /**
   * Get all properties.
   * @param {{}} options An object containing query options.
   * @param {*} limit The number of results to return.
   * @return {Promise<[{}]>}  A promise to the properties.
   */
  getAllProperties: (options, limit = 10) => {
    const queryParams = [];
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
      JOIN property_reviews ON properties.id = property_id
  `;
    const addWhereOrAnd = () => (queryParams.length > 1 ? "AND" : "WHERE");

    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city iLIKE $${queryParams.length} `;
    }

    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      queryString += `${addWhereOrAnd()} owner_id = $${queryParams.length} `;
    }

    if (options.minimum_price_per_night) {
      queryParams.push(`${options.minimum_price_per_night * 100}`);
      queryString += `${addWhereOrAnd()} cost_per_night > $${
        queryParams.length
      } `;
    }

    if (options.maximum_price_per_night) {
      queryParams.push(`${options.maximum_price_per_night * 100}`);
      queryString += `${addWhereOrAnd()} cost_per_night < $${
        queryParams.length
      } `;
    }

    queryString += `GROUP BY properties.id `;

    if (options.minimum_rating) {
      queryParams.push(`${options.minimum_rating}`);
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
    }

    queryParams.push(limit);
    queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length}
    `;

    return pool
      .query(queryString, queryParams)
      .then((res) => res.rows)
      .catch((err) => console.error(err.stack));
  },
  /**
   * Add a property to the database
   * @param {{}} property An object containing all of the property details.
   * @return {Promise<{}>} A promise to the property.
   */
  addProperty: (property) => {
    const queryParams = Object.values(property);
    console.log(property);
    const queryString = `INSERT INTO properties (title, description, number_of_bedrooms, number_of_bathrooms,
      parking_spaces,
      cost_per_night,
      thumbnail_photo_url,
      cover_photo_url,
      street,
      country,
      city,
      province,
      post_code,
      owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
    return pool
      .query(queryString, queryParams)
      .then((res) => res.rows)
      .catch((err) => console.error(err.stack));
  },
};
