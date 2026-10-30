import Swal from 'sweetalert2';

/**
 * Modern SweetAlert2 Confirmation Dialog for Deletions
 */
export const confirmDelete = async ({
  title = 'Are you sure?',
  text = 'You will not be able to revert this action!',
  html = null,
  confirmButtonText = 'Yes, Delete It',
  cancelButtonText = 'Cancel'
}) => {
  const result = await Swal.fire({
    title,
    text: html ? undefined : text,
    html: html || undefined,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48', // rose-600
    cancelButtonColor: '#64748b',  // slate-500
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'rounded-2xl shadow-2xl p-6 border border-gray-100',
      title: 'text-lg font-black text-gray-900',
      htmlContainer: 'text-sm text-gray-600',
      confirmButton: 'rounded-xl font-bold px-5 py-2.5 text-sm shadow-md',
      cancelButton: 'rounded-xl font-semibold px-5 py-2.5 text-sm'
    }
  });

  return result.isConfirmed;
};

/**
 * Success Alert
 */
export const showSuccessAlert = (title = 'Success!', text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-gray-100'
    }
  });
};

/**
 * Error Alert
 */
export const showErrorAlert = (title = 'Error', text = 'Something went wrong.') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#0d9488',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-gray-100',
      confirmButton: 'rounded-xl font-bold px-5 py-2.5'
    }
  });
};

export default Swal;
