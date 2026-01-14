class Node:
    def __init__(self, key):
        self.left = None
        self.right = None
        self.val = key

    @staticmethod
    def create_binarytree(values):
        if not values:
            return None

        root = Node(values[0])
        queue = [root]
        i = 1

        while i < len(values):
            current = queue.pop(0)

            if values[i] is not None:
                current.left = Node(values[i])
                queue.append(current.left)
            i += 1

            if i < len(values) and values[i] is not None:
                current.right = Node(values[i])
                queue.append(current.right)
            i += 1

        return root

    def inorder_print(self):
        def inorder(node):
            if node:
                inorder(node.left)
                result.append(str(node.val))
                inorder(node.right)

        result = []
        inorder(self)
        print(" -> ".join(result))

