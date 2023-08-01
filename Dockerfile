# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application's dependencies inside the Docker image
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Make the container listen on the specified network ports at runtime
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "src/index.js" ]

