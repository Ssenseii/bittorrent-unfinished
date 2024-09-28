import matplotlib.pyplot as plt
import numpy as np

# Define the functions for the boundaries
def sqrt_x(x):
    return np.sqrt(x)

# Set up the x values
x_values = np.linspace(0, 4, 400)
y_values_sqrt_x = sqrt_x(x_values)
y_values_2 = np.full_like(x_values, 2)

# Plot the region D1
plt.figure(figsize=(8, 6))
plt.fill_between(x_values, y_values_sqrt_x, y_values_2, color='gray', alpha=0.5, label=r'$D_1$')
plt.plot(x_values, y_values_sqrt_x, label=r'$y = \sqrt{x}$')
plt.plot(x_values, y_values_2, label=r'$y = 2$')
plt.axvline(x=0, color='black', linestyle='--', linewidth=1)
plt.axvline(x=4, color='black', linestyle='--', linewidth=1)

# Set labels and title
plt.xlabel('x')
plt.ylabel('y')
plt.title('Region $D_1$')
plt.legend()

# Show the plot
plt.grid(True)
plt.show()